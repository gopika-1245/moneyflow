import { NextRequest } from "next/server";
import { getAuthenticatedUser, successResponse, errorResponse } from "@/lib/api-response";
import { z } from "zod";

const updateBudgetSchema = z.object({
  amount: z.number().positive("Budget amount must be greater than 0"),
});

export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { supabase, user, error } = await getAuthenticatedUser();
    if (error || !user) {
      return errorResponse("Unauthorized", 401);
    }

    const body = await request.json();
    const validated = updateBudgetSchema.safeParse(body);
    if (!validated.success) {
      return errorResponse("Validation failed", 422, validated.error.flatten().fieldErrors);
    }

    const { data, error: updateError } = await supabase
      .from("budgets")
      .update({
        amount: validated.data.amount,
        updated_at: new Date().toISOString(),
      })
      .eq("id", params.id)
      .eq("user_id", user.id)
      .select("*, category:categories(*)")
      .single();

    if (updateError || !data) {
      return errorResponse("Failed to update budget", 400);
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
      .from("budgets")
      .delete()
      .eq("id", params.id)
      .eq("user_id", user.id);

    if (deleteError) throw deleteError;

    return successResponse({ message: "Budget deleted successfully" });
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : "Internal Server Error";
    return errorResponse(errorMsg, 500);
  }
}
