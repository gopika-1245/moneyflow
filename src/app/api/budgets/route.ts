import { NextRequest } from "next/server";
import { getAuthenticatedUser, successResponse, errorResponse } from "@/lib/api-response";
import { budgetSchema } from "@/lib/validations";
import { calculateBudgetUtilization } from "@/lib/calculations/finance";
import { format, startOfMonth, endOfMonth } from "date-fns";

export async function GET(request: NextRequest) {
  try {
    const { supabase, user, error } = await getAuthenticatedUser();
    if (error || !user) {
      return errorResponse("Unauthorized", 401);
    }

    const { searchParams } = new URL(request.url);
    const now = new Date();
    const month = parseInt(searchParams.get("month") || String(now.getMonth() + 1), 10);
    const year = parseInt(searchParams.get("year") || String(now.getFullYear()), 10);

    // Fetch budgets for user in specified month & year
    const { data: budgets, error: budgetError } = await supabase
      .from("budgets")
      .select("*, category:categories(*)")
      .eq("user_id", user.id)
      .eq("month", month)
      .eq("year", year)
      .order("created_at", { ascending: true });

    if (budgetError) throw budgetError;

    // Fetch qualifying expense transactions in that month
    const targetDate = new Date(year, month - 1, 1);
    const startDate = format(startOfMonth(targetDate), "yyyy-MM-dd");
    const endDate = format(endOfMonth(targetDate), "yyyy-MM-dd");

    const { data: txs, error: txError } = await supabase
      .from("transactions")
      .select("category_id, amount, type")
      .eq("user_id", user.id)
      .eq("type", "expense")
      .gte("date", startDate)
      .lte("date", endDate);

    if (txError) throw txError;

    // Group expenses by category
    const categorySpending = new Map<string, number>();
    for (const t of txs || []) {
      if (t.category_id) {
        categorySpending.set(
          t.category_id,
          (categorySpending.get(t.category_id) || 0) + Number(t.amount)
        );
      }
    }

    let totalBudget = 0;
    let totalSpent = 0;

    const enrichedBudgets = (budgets || []).map((b) => {
      const spent = categorySpending.get(b.category_id) || 0;
      const util = calculateBudgetUtilization(b.amount, spent);
      totalBudget += Number(b.amount);
      totalSpent += spent;

      return {
        ...b,
        spent: util.spent,
        remaining: util.remaining,
        percentage: util.percentage,
        status: util.status,
      };
    });

    const totalRemaining = Math.max(0, totalBudget - totalSpent);
    const overallPercentage = totalBudget > 0 ? Number(((totalSpent / totalBudget) * 100).toFixed(1)) : 0;

    return successResponse({
      budgets: enrichedBudrichedBudgets(enrichedBudgets),
      overview: {
        totalBudget,
        totalSpent: Number(totalSpent.toFixed(2)),
        totalRemaining: Number(totalRemaining.toFixed(2)),
        overallPercentage,
        status: overallPercentage >= 100 ? "exceeded" : overallPercentage >= 80 ? "warning" : "healthy",
        month,
        year,
      },
    });
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : "Internal Server Error";
    return errorResponse(errorMsg, 500);
  }
}

function enrichedBudrichedBudgets(budgets: unknown[]) {
  return budgets;
}

export async function POST(request: NextRequest) {
  try {
    const { supabase, user, error } = await getAuthenticatedUser();
    if (error || !user) {
      return errorResponse("Unauthorized", 401);
    }

    const body = await request.json();
    const validated = budgetSchema.safeParse(body);
    if (!validated.success) {
      return errorResponse("Validation failed", 422, validated.error.flatten().fieldErrors);
    }

    const { categoryId, amount, month, year } = validated.data;

    // Upsert budget for category + month + year
    const { data, error: insertError } = await supabase
      .from("budgets")
      .upsert(
        {
          user_id: user.id,
          category_id: categoryId,
          amount,
          month,
          year,
          updated_at: new Date().toISOString(),
        },
        {
          onConflict: "user_id,category_id,month,year",
        }
      )
      .select("*, category:categories(*)")
      .single();

    if (insertError) throw insertError;

    return successResponse(data, 201);
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : "Internal Server Error";
    return errorResponse(errorMsg, 500);
  }
}
