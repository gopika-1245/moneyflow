import { NextRequest } from "next/server";
import { getAuthenticatedUser, successResponse, errorResponse } from "@/lib/api-response";
import { savingsGoalSchema } from "@/lib/validations";
import { calculateSavingsProgress } from "@/lib/calculations/finance";

export async function GET(request: NextRequest) {
  try {
    const { supabase, user, error } = await getAuthenticatedUser();
    if (error || !user) {
      return errorResponse("Unauthorized", 401);
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status");

    let query = supabase
      .from("savings_goals")
      .select("*, contributions:goal_contributions(*)")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });

    if (status && ["active", "completed", "cancelled"].includes(status)) {
      query = query.eq("status", status);
    }

    const { data, error: dbError } = await query;
    if (dbError) throw dbError;

    const enrichedGoals = (data || []).map((goal) => {
      const progress = calculateSavingsProgress(goal.target_amount, goal.current_amount);
      return {
        ...goal,
        remaining_amount: progress.remainingAmount,
        progress_percentage: progress.progressPercentage,
      };
    });

    return successResponse(enrichedGoals);
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : "Internal Server Error";
    return errorResponse(errorMsg, 500);
  }
}

export async function POST(request: NextRequest) {
  try {
    const { supabase, user, error } = await getAuthenticatedUser();
    if (error || !user) {
      return errorResponse("Unauthorized", 401);
    }

    const body = await request.json();
    const validated = savingsGoalSchema.safeParse(body);
    if (!validated.success) {
      return errorResponse("Validation failed", 422, validated.error.flatten().fieldErrors);
    }

    const { name, description, targetAmount, currentAmount, targetDate } = validated.data;

    const { data, error: insertError } = await supabase
      .from("savings_goals")
      .insert({
        user_id: user.id,
        name,
        description: description || null,
        target_amount: targetAmount,
        current_amount: currentAmount || 0,
        target_date: targetDate || null,
        status: currentAmount >= targetAmount ? "completed" : "active",
      })
      .select()
      .single();

    if (insertError) throw insertError;

    return successResponse(data, 201);
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : "Internal Server Error";
    return errorResponse(errorMsg, 500);
  }
}
