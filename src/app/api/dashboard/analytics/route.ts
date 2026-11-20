import { NextRequest } from "next/server";
import { getAuthenticatedUser, successResponse, errorResponse } from "@/lib/api-response";
import { subMonths, format, startOfMonth, endOfMonth, parseISO } from "date-fns";
import { TransactionItem } from "@/types/finance";

export async function GET(request: NextRequest) {
  try {
    const { supabase, user, error } = await getAuthenticatedUser();
    if (error || !user) {
      return errorResponse("Unauthorized", 401);
    }

    const { searchParams } = new URL(request.url);
    const monthsBack = parseInt(searchParams.get("months") || "6", 10);
    const accountFilter = searchParams.get("accountId");
    const categoryFilter = searchParams.get("categoryId");

    const now = new Date();
    const startDate = startOfMonth(subMonths(now, monthsBack - 1));
    const endDate = endOfMonth(now);

    let query = supabase
      .from("transactions")
      .select("*, category:categories(*), account:accounts(*)")
      .eq("user_id", user.id)
      .gte("date", format(startDate, "yyyy-MM-dd"))
      .lte("date", format(endDate, "yyyy-MM-dd"))
      .order("date", { ascending: true });

    if (accountFilter) {
      query = query.eq("account_id", accountFilter);
    }
    if (categoryFilter) {
      query = query.eq("category_id", categoryFilter);
    }

    const { data: txsData, error: txError } = await query;
    if (txError) throw txError;

    const txs = (txsData || []) as unknown as TransactionItem[];

    // Monthly breakdown: income vs expense vs savings
    const monthlyMap = new Map<string, { month: string; income: number; expense: number; savings: number }>();
    for (let i = monthsBack - 1; i >= 0; i--) {
      const mDate = subMonths(now, i);
      const key = format(mDate, "MMM yyyy");
      monthlyMap.set(key, { month: key, income: 0, expense: 0, savings: 0 });
    }

    // Category breakdown
    const categoryMap = new Map<string, { category: string; amount: number; color: string; icon: string }>();

    // Income sources
    const incomeSourceMap = new Map<string, { category: string; amount: number; color: string }>();

    // Daily expense trends
    const dailyMap = new Map<string, number>();

    let totalExpenseSum = 0;
    let totalIncomeSum = 0;
    let highestExpense = { title: "None", amount: 0, date: "" };

    for (const t of txs) {
      const amt = Number(t.amount) || 0;
      const tDate = parseISO(t.date);
      const mKey = format(tDate, "MMM yyyy");
      const dKey = format(tDate, "yyyy-MM-dd");

      if (t.type === "income") {
        totalIncomeSum += amt;
        const mObj = monthlyMap.get(mKey);
        if (mObj) mObj.income += amt;

        const catName = t.category?.name || "Other Income";
        const catColor = t.category?.color || "#10b981";
        const prev = incomeSourceMap.get(catName) || { category: catName, amount: 0, color: catColor };
        prev.amount += amt;
        incomeSourceMap.set(catName, prev);
      } else if (t.type === "expense") {
        totalExpenseSum += amt;
        const mObj = monthlyMap.get(mKey);
        if (mObj) mObj.expense += amt;

        const catName = t.category?.name || "Uncategorized";
        const catColor = t.category?.color || "#ef4444";
        const catIcon = t.category?.icon || "Tag";
        const prev = categoryMap.get(catName) || {
          category: catName,
          amount: 0,
          color: catColor,
          icon: catIcon,
        };
        prev.amount += amt;
        categoryMap.set(catName, prev);

        dailyMap.set(dKey, (dailyMap.get(dKey) || 0) + amt);

        if (amt > highestExpense.amount) {
          highestExpense = { title: t.title, amount: amt, date: t.date };
        }
      }
    }

    // Finalize monthly data with savings
    const monthlyTrends = Array.from(monthlyMap.values()).map((m) => ({
      ...m,
      savings: Number((m.income - m.expense).toFixed(2)),
    }));

    // Category breakdown with percentages
    const categoryDistribution = Array.from(categoryMap.values())
      .map((c) => ({
        ...c,
        percentage: totalExpenseSum > 0 ? Number(((c.amount / totalExpenseSum) * 100).toFixed(1)) : 0,
      }))
      .sort((a, b) => b.amount - a.amount);

    const incomeSources = Array.from(incomeSourceMap.values())
      .map((inc) => ({
        ...inc,
        percentage: totalIncomeSum > 0 ? Number(((inc.amount / totalIncomeSum) * 100).toFixed(1)) : 0,
      }))
      .sort((a, b) => b.amount - a.amount);

    // Account distribution
    const { data: accountsData } = await supabase
      .from("accounts")
      .select("*")
      .eq("user_id", user.id)
      .eq("is_archived", false);

    const accountsDistribution = (accountsData || []).map((acc) => ({
      id: acc.id,
      name: acc.name,
      balance: Number(acc.current_balance),
      type: acc.type,
      currency: acc.currency,
    }));

    const dailyTrendList = Array.from(dailyMap.entries())
      .map(([date, amount]) => ({ date, amount: Number(amount.toFixed(2)) }))
      .sort((a, b) => a.date.localeCompare(b.date));

    const highestCategory = categoryDistribution[0]
      ? { name: categoryDistribution[0].category, amount: categoryDistribution[0].amount }
      : { name: "None", amount: 0 };

    return successResponse({
      monthlyTrends,
      categoryDistribution,
      incomeSources,
      accountsDistribution,
      dailyTrendList,
      stats: {
        totalIncome: Number(totalIncomeSum.toFixed(2)),
        totalExpenses: Number(totalExpenseSum.toFixed(2)),
        netSavings: Number((totalIncomeSum - totalExpenseSum).toFixed(2)),
        savingsRate:
          totalIncomeSum > 0 ? Number((((totalIncomeSum - totalExpenseSum) / totalIncomeSum) * 100).toFixed(1)) : 0,
        averageMonthlyExpense: Number((totalExpenseSum / Math.max(1, monthsBack)).toFixed(2)),
        averageMonthlyIncome: Number((totalIncomeSum / Math.max(1, monthsBack)).toFixed(2)),
        highestExpense,
        highestSpendingCategory: highestCategory,
      },
    });
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : "Internal Server Error";
    return errorResponse(errorMsg, 500);
  }
}
