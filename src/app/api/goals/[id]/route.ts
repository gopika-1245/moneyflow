import { NextRequest } from "next/server";
import { getAuthenticatedUser, successResponse, errorResponse } from "@/lib/api-response";
import { z } from "zod";
import { calculateSavingsProgress } from "@/lib/calculations/finance";

const updateGoalSchema = z.object({
  name: z.string().min(1).max(150).optional(),
  description: z.string().max(500).optional().nullable(),
  targetAmount: z.number().positive().optional(),
  targetDate: z.string().optional().nullable(),
  status: z.enum(["active", "completed", "cancelled"]).optional(),
});

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { supabase, user, error } = await getAuthenticatedUser();
    if (error || !user) {
      return errorResponse("Unauthorized", 401);
    }

    const { data, error: dbError } = await supabase
      .from("savings_goals")
      .select("*, contributions:goal_contributions(*)")
      .eq("id", params.id)
      .eq("user_id", user.id)
      .single();

    if (dbError || !data) {
      return errorResponse("Goal not found", 404);
    }

    const progress = calculateSavingsProgress(data.target_amount, data.current_amount);

    return successResponse({
      ...data,
      remaining_amount: progress.remainingAmount,
      progress_percentage: progress.progressPercentage,
    });
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : "Internal Server Error";
    return errorResponse(errorMsg, 500);
  }
}

export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { supabase, user, error } = await getAuthenticatedUser();
    if (error || !user) {
      return errorResponse("Unauthorized", 401);
    }

    const body = await request.json();
    const validated = updateGoalSchema.safeParse(body);
    if (!validated.success) {
      return errorResponse("Validation failed", 422, validated.error.flatten().fieldErrors);
    }

    const updates: any = {
      updated_at: new Date().toISOString(),
    };
    if (validated.data.name !== undefined) updates.name = validated.data.name;
    if (validated.data.description !== undefined) updates.description = validated.data.description;
    if (validated.data.targetAmount !== undefined) updates.target_amount = validated.data.targetAmount;
    if (validated.data.targetDate !== undefined) updates.target_date = validated.data.targetDate;
    if (validated.data.status !== undefined) updates.status = validated.data.status;

    const { data, error: updateError } = await supabase
      .from("savings_goals")
      .update(updates)
      .eq("id", params.id)
      .eq("user_id", user.id)
      .select()
      .single();

    if (updateError || !data) {
      return errorResponse("Failed to update goal", 400);
    }

    return successResponse(data);
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

    const { error: deleteError } = await supabase
      .from("savings_goals")
      .delete()
      .eq("id", params.id)
      .eq("user_id", user.id);

    if (deleteError) throw deleteError;

    return successResponse({ message: "Goal deleted successfully" });
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : "Internal Server Error";
    return errorResponse(errorMsg, 500);
  }
}
