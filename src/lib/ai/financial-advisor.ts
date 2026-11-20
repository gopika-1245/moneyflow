import { SupabaseClient } from "@supabase/supabase-js";
import { Database } from "@/types/database";
import { formatCurrency } from "@/lib/utils";
import { calculateAccountBalances, calculateCashFlowMetrics, calculateBudgetUtilization } from "@/lib/calculations/finance";
import { startOfMonth, endOfMonth, subMonths, format } from "date-fns";
import { AccountItem, TransactionItem } from "@/types/finance";

export interface FinancialContext {
  netBalance: number;
  totalAssets: number;
  totalLiabilities: number;
  currentMonthIncome: number;
  currentMonthExpenses: number;
  currentMonthSavings: number;
  savingsRate: number;
  lastMonthIncome: number;
  lastMonthExpenses: number;
  lastMonthSavings: number;
  expenseCategories: { category: string; amount: number; percentage: number }[];
  highestExpenses: { title: string; amount: number; date: string; category: string }[];
  budgetAlerts: { category: string; budget: number; spent: number; percentage: number; status: string }[];
  upcomingPayments: { title: string; amount: number; date: string; type: string }[];
  currency: string;
}

/**
 * Deterministically computes user's real financial context from Postgres tables
 */
export async function getDeterministicFinancialContext(
  supabase: SupabaseClient<Database>,
  userId: string
): Promise<FinancialContext> {
  const now = new Date();
  const currentStart = format(startOfMonth(now), "yyyy-MM-dd");
  const currentEnd = format(endOfMonth(now), "yyyy-MM-dd");

  const lastMonth = subMonths(now, 1);
  const lastStart = format(startOfMonth(lastMonth), "yyyy-MM-dd");
  const lastEnd = format(endOfMonth(lastMonth), "yyyy-MM-dd");

  // 1. Accounts
  const { data: accountsData } = await supabase
    .from("accounts")
    .select("*")
    .eq("user_id", userId)
    .eq("is_archived", false);

  const accounts = (accountsData || []) as unknown as AccountItem[];
  const balanceInfo = calculateAccountBalances(accounts);
  const userCurrency = accounts[0]?.currency || "INR";

  // 2. Current Month Transactions
  const { data: currentTxsData } = await supabase
    .from("transactions")
    .select("*, category:categories(*), account:accounts(*)")
    .eq("user_id", userId)
    .gte("date", currentStart)
    .lte("date", currentEnd);

  const currentTxs = (currentTxsData || []) as unknown as TransactionItem[];
  const currentMetrics = calculateCashFlowMetrics(currentTxs);

  // 3. Last Month Transactions
  const { data: lastTxsData } = await supabase
    .from("transactions")
    .select("*, category:categories(*)")
    .eq("user_id", userId)
    .gte("date", lastStart)
    .lte("date", lastEnd);

  const lastTxs = (lastTxsData || []) as unknown as TransactionItem[];
  const lastMetrics = calculateCashFlowMetrics(lastTxs);

  // 4. Category Breakdown this month
  const categoryMap = new Map<string, number>();
  for (const t of currentTxs) {
    if (t.type === "expense") {
      const cat = t.category?.name || "Uncategorized";
      categoryMap.set(cat, (categoryMap.get(cat) || 0) + Number(t.amount));
    }
  }

  const expenseCategories = Array.from(categoryMap.entries())
    .map(([category, amount]) => ({
      category,
      amount,
      percentage:
        currentMetrics.totalExpenses > 0
          ? Number(((amount / currentMetrics.totalExpenses) * 100).toFixed(1))
          : 0,
    }))
    .sort((a, b) => b.amount - a.amount);

  // 5. Highest Expenses
  const highestExpenses = currentTxs
    .filter((t) => t.type === "expense")
    .sort((a, b) => Number(b.amount) - Number(a.amount))
    .slice(0, 5)
    .map((t) => ({
      title: t.title,
      amount: Number(t.amount),
      date: t.date,
      category: t.category?.name || "Uncategorized",
    }));

  // 6. Budgets
  const { data: budgetsData } = await supabase
    .from("budgets")
    .select("*, category:categories(*)")
    .eq("user_id", userId)
    .eq("month", now.getMonth() + 1)
    .eq("year", now.getFullYear());

  const budgetAlerts = (budgetsData || []).map((b: any) => {
    const spent = categoryMap.get(b.category?.name || "") || 0;
    const util = calculateBudgetUtilization(b.amount, spent);
    return {
      category: b.category?.name || "Budget Category",
      budget: util.budget,
      spent: util.spent,
      percentage: util.percentage,
      status: util.status,
    };
  });

  // 7. Upcoming payments (recurring & reminders)
  const todayStr = format(now, "yyyy-MM-dd");
  const { data: recurringData } = await supabase
    .from("recurring_transactions")
    .select("*")
    .eq("user_id", userId)
    .eq("is_active", true)
    .gte("next_occurrence", todayStr)
    .order("next_occurrence", { ascending: true })
    .limit(5);

  const { data: reminderData } = await supabase
    .from("reminders")
    .select("*")
    .eq("user_id", userId)
    .eq("status", "pending")
    .gte("due_date", todayStr)
    .order("due_date", { ascending: true })
    .limit(5);

  const upcomingPayments = [
    ...(recurringData || []).map((r: any) => ({
      title: r.title,
      amount: Number(r.amount),
      date: r.next_occurrence,
      type: "Recurring Payment",
    })),
    ...(reminderData || []).map((rem: any) => ({
      title: rem.title,
      amount: Number(rem.amount) || 0,
      date: rem.due_date,
      type: "Bill Reminder",
    })),
  ].sort((a, b) => a.date.localeCompare(b.date));

  return {
    netBalance: balanceInfo.totalBalance,
    totalAssets: balanceInfo.totalAssets,
    totalLiabilities: balanceInfo.totalLiabilities,
    currentMonthIncome: currentMetrics.totalIncome,
    currentMonthExpenses: currentMetrics.totalExpenses,
    currentMonthSavings: currentMetrics.netSavings,
    savingsRate: currentMetrics.savingsRate,
    lastMonthIncome: lastMetrics.totalIncome,
    lastMonthExpenses: lastMetrics.totalExpenses,
    lastMonthSavings: lastMetrics.netSavings,
    expenseCategories,
    highestExpenses,
    budgetAlerts,
    upcomingPayments,
    currency: userCurrency,
  };
}

/**
 * Generates an intelligent, deterministic, and accurate answer to user queries
 */
export function generateDeterministicResponse(prompt: string, ctx: FinancialContext): string {
  const p = prompt.toLowerCase();
  const c = ctx.currency;

  if (p.includes("spend") || p.includes("expense") || p.includes("cost")) {
    if (p.includes("last month") || p.includes("previous")) {
      return `Last month, your total expenses were **${formatCurrency(ctx.lastMonthExpenses, c)}** with an income of **${formatCurrency(ctx.lastMonthIncome, c)}**, resulting in net savings of **${formatCurrency(ctx.lastMonthSavings, c)}**.`;
    }
    const topCat = ctx.expenseCategories[0];
    const topCatText = topCat
      ? ` The highest spending category is **${topCat.category}** at **${formatCurrency(topCat.amount, c)}** (${topCat.percentage}% of expenses).`
      : "";
    return `This month, your total recorded expenses are **${formatCurrency(ctx.currentMonthExpenses, c)}**.${topCatText}`;
  }

  if (p.includes("category") || p.includes("consumed") || p.includes("where")) {
    if (ctx.expenseCategories.length === 0) {
      return `You don't have any expense records categorized for this month yet.`;
    }
    const list = ctx.expenseCategories
      .slice(0, 5)
      .map((cItem, i) => `${i + 1}. **${cItem.category}**: ${formatCurrency(cItem.amount, c)} (${cItem.percentage}%)`)
      .join("\n");
    return `Here is your spending breakdown by category this month:\n\n${list}\n\nThe top category is **${ctx.expenseCategories[0].category}**, which accounts for **${ctx.expenseCategories[0].percentage}%** of your total spending.`;
  }

  if (p.includes("compare") || p.includes("vs last month") || p.includes("growth")) {
    const diff = ctx.currentMonthExpenses - ctx.lastMonthExpenses;
    const diffText =
      diff > 0
        ? `increased by **${formatCurrency(diff, c)}**`
        : diff < 0
        ? `decreased by **${formatCurrency(Math.abs(diff), c)}**`
        : `stayed exactly the same`;
    return `### Monthly Spending Comparison\n\n- **This Month's Expenses:** ${formatCurrency(ctx.currentMonthExpenses, c)}\n- **Last Month's Expenses:** ${formatCurrency(ctx.lastMonthExpenses, c)}\n- **Difference:** Your spending has ${diffText}.\n- **This Month's Savings Rate:** ${ctx.savingsRate}%\n- **Last Month's Savings Rate:** ${ctx.lastMonthIncome > 0 ? ((ctx.lastMonthSavings / ctx.lastMonthIncome) * 100).toFixed(1) : "0"}%`;
  }

  if (p.includes("save") || p.includes("saving")) {
    return `This month, your net savings are **${formatCurrency(ctx.currentMonthSavings, c)}**, representing a savings rate of **${ctx.savingsRate}%** of your recorded income (**${formatCurrency(ctx.currentMonthIncome, c)}**).`;
  }

  if (p.includes("upcoming") || p.includes("bill") || p.includes("payment") || p.includes("due")) {
    if (ctx.upcomingPayments.length === 0) {
      return `You have no scheduled upcoming recurring payments or pending reminders right now.`;
    }
    const list = ctx.upcomingPayments
      .map(
        (up) =>
          `- **${up.title}** (${up.type}): ${up.amount > 0 ? formatCurrency(up.amount, c) : "Reminder"} due on **${up.date}**`
      )
      .join("\n");
    return `### Upcoming Scheduled Payments & Reminders\n\n${list}`;
  }

  if (p.includes("budget") || p.includes("exceed") || p.includes("limit")) {
    if (ctx.budgetAlerts.length === 0) {
      return `You have not set any category budgets for this month. You can create them in the **Budgets** section.`;
    }
    const exceeded = ctx.budgetAlerts.filter((b) => b.status === "exceeded");
    const warning = ctx.budgetAlerts.filter((b) => b.status === "warning");

    let statusMsg = "All your category budgets are currently healthy (< 80% utilization).";
    if (exceeded.length > 0) {
      statusMsg = `⚠️ **Warning:** You have exceeded budget in **${exceeded.map((e) => e.category).join(", ")}**!`;
    } else if (warning.length > 0) {
      statusMsg = `⚡ **Heads up:** You are nearing your budget limit in **${warning.map((w) => w.category).join(", ")}** (>= 80% spent).`;
    }

    const items = ctx.budgetAlerts
      .map(
        (b) =>
          `- **${b.category}**: ${formatCurrency(b.spent, c)} of ${formatCurrency(b.budget, c)} spent (${b.percentage}%) [Status: ${b.status.toUpperCase()}]`
      )
      .join("\n");

    return `${statusMsg}\n\n### Budget Status\n\n${items}`;
  }

  if (p.includes("highest") || p.includes("biggest") || p.includes("top expense")) {
    if (ctx.highestExpenses.length === 0) {
      return `No expense transactions have been recorded this month yet.`;
    }
    const list = ctx.highestExpenses
      .map(
        (h, i) =>
          `${i + 1}. **${h.title}**: ${formatCurrency(h.amount, c)} on ${h.date} (${h.category})`
      )
      .join("\n");
    return `### Your Highest Expenses This Month\n\n${list}`;
  }

  if (p.includes("summary") || p.includes("overview") || p.includes("activity") || p.includes("financial life")) {
    return `### Comprehensive Financial Summary\n\n` +
      `- **Total Available Net Balance:** ${formatCurrency(ctx.netBalance, c)}\n` +
      `- **Tracked Assets:** ${formatCurrency(ctx.totalAssets, c)}\n` +
      `- **Liabilities & Credit Dues:** ${formatCurrency(ctx.totalLiabilities, c)}\n` +
      `- **This Month Income:** ${formatCurrency(ctx.currentMonthIncome, c)}\n` +
      `- **This Month Expenses:** ${formatCurrency(ctx.currentMonthExpenses, c)}\n` +
      `- **Net Savings:** ${formatCurrency(ctx.currentMonthSavings, c)} (${ctx.savingsRate}% savings rate)\n\n` +
      `${ctx.expenseCategories.length > 0 ? `**Top Expense:** ${ctx.expenseCategories[0].category} (${formatCurrency(ctx.expenseCategories[0].amount, c)})\n\n` : ""}` +
      `*Note: All calculations are computed deterministically from your authenticated account records.*`;
  }

  // General helpful fintech response with actual metrics
  return `Based on your live account data, your current net balance is **${formatCurrency(ctx.netBalance, c)}** with **${formatCurrency(ctx.currentMonthExpenses, c)}** spent and **${formatCurrency(ctx.currentMonthIncome, c)}** earned this month.\n\n` +
    `You can ask me specific questions such as:\n` +
    `- *"How much did I spend this month?"*\n` +
    `- *"Which category consumed most of my money?"*\n` +
    `- *"Compare my spending with last month"*\n` +
    `- *"Am I exceeding my budget?"*\n` +
    `- *"What are my upcoming payments?"*\n` +
    `- *"Show my highest expenses"*`;
}

/**
 * Dispatches to external LLM (Gemini) if configured, or deterministic engine.
 */
export async function askFinancialAdvisor(
  prompt: string,
  ctx: FinancialContext
): Promise<{ answer: string; provider: "gemini" | "deterministic" }> {
  const apiKey = process.env.GEMINI_API_KEY;

  if (apiKey && apiKey !== "your_gemini_api_key_here") {
    try {
      const systemInstruction = `You are the MoneyFlow AI Financial Assistant.
You have access to the user's REAL, calculated deterministic financial data:
- Net Balance: ${ctx.netBalance} ${ctx.currency}
- Total Assets: ${ctx.totalAssets} ${ctx.currency}
- Total Liabilities: ${ctx.totalLiabilities} ${ctx.currency}
- Current Month Income: ${ctx.currentMonthIncome} ${ctx.currency}
- Current Month Expenses: ${ctx.currentMonthExpenses} ${ctx.currency}
- Current Month Net Savings: ${ctx.currentMonthSavings} ${ctx.currency} (${ctx.savingsRate}% savings rate)
- Last Month Income: ${ctx.lastMonthIncome} ${ctx.currency}
- Last Month Expenses: ${ctx.lastMonthExpenses} ${ctx.currency}
- Expense Categories Breakdown: ${JSON.stringify(ctx.expenseCategories)}
- Highest Expenses: ${JSON.stringify(ctx.highestExpenses)}
- Budget Alerts: ${JSON.stringify(ctx.budgetAlerts)}
- Upcoming Scheduled Payments: ${JSON.stringify(ctx.upcomingPayments)}

STRICT RULES:
1. Never invent or hallucinate financial figures. Always use the numbers provided above.
2. Format currency amounts using ${ctx.currency}.
3. Provide crisp, professional, insightful fintech commentary.
4. Add a brief disclaimer that this is educational financial tracking and not formal tax, investment, or legal advice.`;

      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            contents: [
              {
                role: "user",
                parts: [{ text: `${systemInstruction}\n\nUser Question: ${prompt}` }],
              },
            ],
            generationConfig: {
              temperature: 0.2,
              maxOutputTokens: 1000,
            },
          }),
        }
      );

      if (response.ok) {
        const json = await response.json();
        const candidate = json?.candidates?.[0]?.content?.parts?.[0]?.text;
        if (candidate) {
          return { answer: candidate, provider: "gemini" };
        }
      }
    } catch {
      // Fallback seamlessly to deterministic engine
    }
  }

  const deterministicAnswer = generateDeterministicResponse(prompt, ctx);
  const disclaimer = `\n\n*Disclaimer: MoneyFlow AI provides automated financial insights from your recorded transactions for informational purposes only, not formal investment, tax, or legal advice.*`;

  return {
    answer: deterministicAnswer + disclaimer,
    provider: "deterministic",
  };
}
