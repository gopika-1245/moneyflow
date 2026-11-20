import { NextRequest } from "next/server";
import { getAuthenticatedUser, successResponse, errorResponse } from "@/lib/api-response";
import { z } from "zod";

const updateCategorySchema = z.object({
  name: z.string().min(1).max(50).optional(),
  type: z.enum(["income", "expense"]).optional(),
  icon: z.string().min(1).optional(),
  color: z.string().min(1).optional(),
});

export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { supabase, user, error } = await getAuthenticatedUser();
    if (error || !user) {
      return errorResponse("Unauthorized", 401);
    }

    const body = await request.json();
    const validated = updateCategorySchema.safeParse(body);
    if (!validated.success) {
      return errorResponse("Validation failed", 422, validated.error.flatten().fieldErrors);
    }

    // Only allow updating user's custom categories
    const { data, error: updateError } = await supabase
      .from("categories")
      .update({
        ...validated.data,
        updated_at: new Date().toISOString(),
      })
      .eq("id", params.id)
      .eq("user_id", user.id)
      .eq("is_system", false)
      .select()
      .single();

    if (updateError || !data) {
      return errorResponse("Cannot edit system category or category not found", 400);
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

    // Verify it is not a system category
    const { data: category, error: catError } = await supabase
      .from("categories")
      .select("*")
      .eq("id", params.id)
      .single();

    if (catError || !category) {
      return errorResponse("Category not found", 404);
    }

    if (category.is_system) {
      return errorResponse("Default system categories cannot be deleted", 403);
    }

    if (category.user_id !== user.id) {
      return errorResponse("Unauthorized", 403);
    }

    // Check if actively referenced in transactions or budgets
    const { count: txCount } = await supabase
      .from("transactions")
      .select("id", { count: "exact", head: true })
      .eq("category_id", params.id);

    const { count: budgetCount } = await supabase
      .from("budgets")
      .select("id", { count: "exact", head: true })
      .eq("category_id", params.id);

    if ((txCount && txCount > 0) || (budgetCount && budgetCount > 0)) {
      return errorResponse(
        `Cannot delete this category because it is used in ${txCount || 0} transaction(s) and ${budgetCount || 0} budget(s). Reassign them first.`,
        400
      );
    }

    const { error: deleteError } = await supabase
      .from("categories")
      .delete()
      .eq("id", params.id)
      .eq("user_id", user.id);

    if (deleteError) throw deleteError;

    return successResponse({ message: "Category deleted successfully" });
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : "Internal Server Error";
    return errorResponse(errorMsg, 500);
  }
}
