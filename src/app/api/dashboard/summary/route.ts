import { NextRequest } from "next/server";
import { getAuthenticatedUser, successResponse, errorResponse } from "@/lib/api-response";
import { calculateAccountBalances, calculateCashFlowMetrics, calculateBudgetUtilization } from "@/lib/calculations/finance";
import { startOfMonth, endOfMonth, subMonths, startOfYear, parseISO, isAfter, isBefore, isEqual } from "date-fns";
import { AccountItem, TransactionItem } from "@/types/finance";

export async function GET(request: NextRequest) {
  try {
    const { supabase, user, error } = await getAuthenticatedUser();
    if (error || !user) {
      return errorResponse("Unauthorized", 401);
    }

    const { searchParams } = new URL(request.url);
    const filter = searchParams.get("filter") || "this_month";
    const customStart = searchParams.get("startDate");
    const customEnd = searchParams.get("endDate");

    const now = new Date();
    let startDate: Date = startOfMonth(now);
    let endDate: Date = endOfMonth(now);
    let periodLabel = "This Month";

    if (filter === "this_week") {
      startDate = new Date(now.setDate(now.getDate() - now.getDay()));
      endDate = new Date(now.setDate(now.getDate() - now.getDay() + 6));
      periodLabel = "This Week";
    } else if (filter === "last_month") {
      const lastMonth = subMonths(new Date(), 1);
      startDate = startOfMonth(lastMonth);
      endDate = endOfMonth(lastMonth);
      periodLabel = "Last Month";
    } else if (filter === "last_3_months") {
      startDate = startOfMonth(subMonths(new Date(), 2));
      endDate = endOfMonth(new Date());
      periodLabel = "Last 3 Months";
    } else if (filter === "this_year") {
      startDate = startOfYear(new Date());
      endDate = new Date();
      periodLabel = "This Year";
    } else if (filter === "custom" && customStart && customEnd) {
      startDate = parseISO(customStart);
      endDate = parseISO(customEnd);
      periodLabel = "Custom Range";
    }

    const startStr = startDate.toISOString().split("T")[0];
    const endStr = endDate.toISOString().split("T")[0];

    // 1. Fetch Accounts
    const { data: accountsData } = await supabase
      .from("accounts")
      .select("*")
      .eq("user_id", user.id)
      .eq("is_archived", false);

    const accounts = (accountsData || []) as unknown as AccountItem[];
    const balanceMetrics = calculateAccountBalances(accounts);

    // 2. Fetch Transactions in Period
    const { data: periodTxData } = await supabase
      .from("transactions")
      .select("*, category:categories(*), account:accounts(*)")
      .eq("user_id", user.id)
      .gte("date", startStr)
      .lte("date", endStr)
      .order("date", { ascending: false });

    const periodTransactions = (periodTxData || []) as unknown as TransactionItem[];
    const cashFlow = calculateCashFlowMetrics(periodTransactions);

    // 3. Fetch Latest 10 Transactions
    const { data: recentTxData } = await supabase
      .from("transactions")
      .select("*, category:categories(*), account:accounts(*)")
      .eq("user_id", user.id)
      .order("date", { ascending: false })
      .order("created_at", { ascending: false })
      .limit(10);

    // 4. Fetch Budgets for Current Month & Year
    const currentMonth = now.getMonth() + 1;
    const currentYear = now.getFullYear();
    const { data: budgetsData } = await supabase
      .from("budgets")
      .select("*, category:categories(*)")
      .eq("user_id", user.id)
      .eq("month", currentMonth)
      .eq("year", currentYear);

    // Calculate budget spent by category
    const budgetOverview = (budgetsData || []).map((b) => {
      const catSpent = periodTransactions
        .filter((t) => t.type === "expense" && t.category_id === b.category_id)
        .reduce((sum, t) => sum + (Number(t.amount) || 0), 0);
      const util = calculateBudgetUtilization(b.amount, catSpent);
      return {
        ...b,
        spent: util.spent,
        remaining: util.remaining,
        percentage: util.percentage,
        status: util.status,
      };
    });

    // 5. Fetch Active Savings Goals
    const { data: goalsData } = await supabase
      .from("savings_goals")
      .select("*")
      .eq("user_id", user.id)
      .eq("status", "active")
      .order("created_at", { ascending: false })
      .limit(5);

    // 6. Fetch Upcoming Reminders & Recurring
    const todayStr = new Date().toISOString().split("T")[0];
    const { data: upcomingReminders } = await supabase
      .from("reminders")
      .select("*, category:categories(*)")
      .eq("user_id", user.id)
      .eq("status", "pending")
      .gte("due_date", todayStr)
      .order("due_date", { ascending: true })
      .limit(5);

    const { data: upcomingRecurring } = await supabase
      .from("recurring_transactions")
      .select("*, category:categories(*), account:accounts(*)")
      .eq("user_id", user.id)
      .eq("is_active", true)
      .gte("next_occurrence", todayStr)
      .order("next_occurrence", { ascending: true })
      .limit(5);

    return successResponse({
      summary: {
        totalBalance: balanceMetrics.totalBalance,
        totalAssets: balanceMetrics.totalAssets,
        totalLiabilities: balanceMetrics.totalLiabilities,
        monthlyIncome: cashFlow.totalIncome,
        monthlyExpenses: cashFlow.totalExpenses,
        monthlySavings: cashFlow.netSavings,
        savingsRate: cashFlow.savingsRate,
        netCashFlow: cashFlow.netSavings,
        periodLabel,
      },
      accounts,
      recentTransactions: recentTxData || [],
      budgets: budgetOverview,
      savingsGoals: goalsData || [],
      upcomingReminders: upcomingReminders || [],
      upcomingRecurring: upcomingRecurring || [],
    });
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : "Internal Server Error";
    return errorResponse(errorMsg, 500);
  }
}
