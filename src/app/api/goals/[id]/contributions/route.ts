import { NextRequest } from "next/server";
import { getAuthenticatedUser, successResponse, errorResponse } from "@/lib/api-response";
import { goalContributionSchema } from "@/lib/validations";

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { supabase, user, error } = await getAuthenticatedUser();
    if (error || !user) {
      return errorResponse("Unauthorized", 401);
    }

    const body = await request.json();
    const validated = goalContributionSchema.safeParse(body);
    if (!validated.success) {
      return errorResponse("Validation failed", 422, validated.error.flatten().fieldErrors);
    }

    // Verify goal ownership
    const { data: goal, error: goalError } = await supabase
      .from("savings_goals")
      .select("id")
      .eq("id", params.id)
      .eq("user_id", user.id)
      .single();

    if (goalError || !goal) {
      return errorResponse("Savings goal not found", 404);
    }

    const { amount, date, notes } = validated.data;

    // Insert contribution. The database trigger `handle_goal_contribution` will automatically update goal's current_amount!
    const { data, error: insertError } = await supabase
      .from("goal_contributions")
      .insert({
        goal_id: params.id,
        user_id: user.id,
        amount,
        date,
        notes: notes || null,
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

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { supabase, user, error } = await getAuthenticatedUser();
    if (error || !user) {
      return errorResponse("Unauthorized", 401);
    }

    const { searchParams } = new URL(request.url);
    const contributionId = searchParams.get("contributionId");

    if (!contributionId) {
      return errorResponse("Contribution ID is required", 400);
    }

    // Deleting contribution automatically adjusts savings goal balance via DB trigger
    const { error: deleteError } = await supabase
      .from("goal_contributions")
      .delete()
      .eq("id", contributionId)
      .eq("goal_id", params.id)
      .eq("user_id", user.id);

    if (deleteError) throw deleteError;

    return successResponse({ message: "Contribution removed successfully" });
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : "Internal Server Error";
    return errorResponse(errorMsg, 500);
  }
}
