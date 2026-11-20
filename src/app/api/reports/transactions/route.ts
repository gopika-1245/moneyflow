import { NextRequest } from "next/server";
import { getAuthenticatedUser, successResponse, errorResponse } from "@/lib/api-response";
import { calculateCashFlowMetrics } from "@/lib/calculations/finance";
import { TransactionItem } from "@/types/finance";

export async function GET(request: NextRequest) {
  try {
    const { supabase, user, error } = await getAuthenticatedUser();
    if (error || !user) {
      return errorResponse("Unauthorized", 401);
    }

    const { searchParams } = new URL(request.url);
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");
    const type = searchParams.get("type");
    const categoryId = searchParams.get("categoryId");
    const accountId = searchParams.get("accountId");

    let query = supabase
      .from("transactions")
      .select("*, category:categories(*), account:accounts(*)")
      .eq("user_id", user.id)
      .order("date", { ascending: false });

    if (startDate) query = query.gte("date", startDate);
    if (endDate) query = query.lte("date", endDate);
    if (type) query = query.eq("type", type);
    if (categoryId) query = query.eq("category_id", categoryId);
    if (accountId) query = query.eq("account_id", accountId);

    const { data, error: dbError } = await query;
    if (dbError) throw dbError;

    const txs = (data || []) as unknown as TransactionItem[];
    const metrics = calculateCashFlowMetrics(txs);

    // Category breakdown
    const categoryTotals = new Map<string, { category: string; amount: number; count: number; color: string }>();
    for (const t of txs) {
      if (t.type === "expense") {
        const catName = t.category?.name || "Uncategorized";
        const catColor = t.category?.color || "#ef4444";
        const prev = categoryTotals.get(catName) || { category: catName, amount: 0, count: 0, color: catColor };
        prev.amount += Number(t.amount);
        prev.count += 1;
        categoryTotals.set(catName, prev);
      }
    }

    const categoryBreakdown = Array.from(categoryTotals.values()).map((c) => ({
      ...c,
      percentage: metrics.totalExpenses > 0 ? Number(((c.amount / metrics.totalExpenses) * 100).toFixed(1)) : 0,
    }));

    return successResponse({
      transactions: txs,
      summary: {
        totalIncome: metrics.totalIncome,
        totalExpenses: metrics.totalExpenses,
        netSavings: metrics.netSavings,
        savingsRate: metrics.savingsRate,
        transactionCount: txs.length,
      },
      categoryBreakdown,
    });
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : "Internal Server Error";
    return errorResponse(errorMsg, 500);
  }
}
