import { NextRequest } from "next/server";
import { getAuthenticatedUser, successResponse, errorResponse } from "@/lib/api-response";
import { z } from "zod";

const updateReminderSchema = z.object({
  title: z.string().min(1).max(150).optional(),
  description: z.string().max(500).optional().nullable(),
  dueDate: z.string().optional(),
  amount: z.number().min(0).optional().nullable(),
  categoryId: z.string().uuid().optional().nullable(),
  recurrence: z.enum(["none", "daily", "weekly", "monthly", "quarterly", "yearly"]).optional(),
  status: z.enum(["pending", "completed", "dismissed"]).optional(),
  notificationPreference: z.enum(["in_app", "email", "both"]).optional(),
});

export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { supabase, user, error } = await getAuthenticatedUser();
    if (error || !user) {
      return errorResponse("Unauthorized", 401);
    }

    const body = await request.json();
    const validated = updateReminderSchema.safeParse(body);
    if (!validated.success) {
      return errorResponse("Validation failed", 422, validated.error.flatten().fieldErrors);
    }

    const updates: any = {
      updated_at: new Date().toISOString(),
    };
    if (validated.data.title !== undefined) updates.title = validated.data.title;
    if (validated.data.description !== undefined) updates.description = validated.data.description;
    if (validated.data.dueDate !== undefined) updates.due_date = validated.data.dueDate;
    if (validated.data.amount !== undefined) updates.amount = validated.data.amount;
    if (validated.data.categoryId !== undefined) updates.category_id = validated.data.categoryId;
    if (validated.data.recurrence !== undefined) updates.recurrence = validated.data.recurrence;
    if (validated.data.status !== undefined) updates.status = validated.data.status;
    if (validated.data.notificationPreference !== undefined)
      updates.notification_preference = validated.data.notificationPreference;

    const { data, error: updateError } = await supabase
      .from("reminders")
      .update(updates)
      .eq("id", params.id)
      .eq("user_id", user.id)
      .select("*, category:categories(*)")
      .single();

    if (updateError || !data) {
      return errorResponse("Failed to update reminder", 400);
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
      .from("reminders")
      .delete()
      .eq("id", params.id)
      .eq("user_id", user.id);

    if (deleteError) throw deleteError;

    return successResponse({ message: "Reminder deleted successfully" });
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : "Internal Server Error";
    return errorResponse(errorMsg, 500);
  }
}
