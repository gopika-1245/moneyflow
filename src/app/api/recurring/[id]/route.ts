import { NextRequest } from "next/server";
import { getAuthenticatedUser, successResponse, errorResponse } from "@/lib/api-response";
import { z } from "zod";

const updateRecurringSchema = z.object({
  title: z.string().min(1).max(150).optional(),
  amount: z.number().positive().optional(),
  type: z.enum(["income", "expense", "transfer"]).optional(),
  categoryId: z.string().uuid().optional().nullable(),
  accountId: z.string().uuid().optional(),
  toAccountId: z.string().uuid().optional().nullable(),
  frequency: z.enum(["daily", "weekly", "monthly", "quarterly", "yearly"]).optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional().nullable(),
  nextOccurrence: z.string().optional(),
  notes: z.string().max(500).optional().nullable(),
  isActive: z.boolean().optional(),
});

export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { supabase, user, error } = await getAuthenticatedUser();
    if (error || !user) {
      return errorResponse("Unauthorized", 401);
    }

    const body = await request.json();
    const validated = updateRecurringSchema.safeParse(body);
    if (!validated.success) {
      return errorResponse("Validation failed", 422, validated.error.flatten().fieldErrors);
    }

    const updates: any = {
      updated_at: new Date().toISOString(),
    };
    if (validated.data.title !== undefined) updates.title = validated.data.title;
    if (validated.data.amount !== undefined) updates.amount = validated.data.amount;
    if (validated.data.type !== undefined) updates.type = validated.data.type;
    if (validated.data.categoryId !== undefined) updates.category_id = validated.data.categoryId;
    if (validated.data.accountId !== undefined) updates.account_id = validated.data.accountId;
    if (validated.data.toAccountId !== undefined) updates.to_account_id = validated.data.toAccountId;
    if (validated.data.frequency !== undefined) updates.frequency = validated.data.frequency;
    if (validated.data.startDate !== undefined) updates.start_date = validated.data.startDate;
    if (validated.data.endDate !== undefined) updates.end_date = validated.data.endDate;
    if (validated.data.nextOccurrence !== undefined) updates.next_occurrence = validated.data.nextOccurrence;
    if (validated.data.notes !== undefined) updates.notes = validated.data.notes;
    if (validated.data.isActive !== undefined) updates.is_active = validated.data.isActive;

    const { data, error: updateError } = await supabase
      .from("recurring_transactions")
      .update(updates)
      .eq("id", params.id)
      .eq("user_id", user.id)
      .select("*, category:categories(*), account:accounts(*)")
      .single();

    if (updateError || !data) {
      return errorResponse("Failed to update recurring schedule", 400);
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
      .from("recurring_transactions")
      .delete()
      .eq("id", params.id)
      .eq("user_id", user.id);

    if (deleteError) throw deleteError;

    return successResponse({ message: "Recurring schedule deleted successfully" });
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : "Internal Server Error";
    return errorResponse(errorMsg, 500);
  }
}
