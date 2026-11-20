import { NextRequest } from "next/server";
import { getAuthenticatedUser, successResponse, errorResponse } from "@/lib/api-response";
import { reminderSchema } from "@/lib/validations";

export async function GET(request: NextRequest) {
  try {
    const { supabase, user, error } = await getAuthenticatedUser();
    if (error || !user) {
      return errorResponse("Unauthorized", 401);
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status");

    let query = supabase
      .from("reminders")
      .select("*, category:categories(*)")
      .eq("user_id", user.id)
      .order("due_date", { ascending: true });

    if (status) {
      query = query.eq("status", status);
    }

    const { data, error: dbError } = await query;
    if (dbError) throw dbError;

    return successResponse(data);
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
    const validated = reminderSchema.safeParse(body);
    if (!validated.success) {
      return errorResponse("Validation failed", 422, validated.error.flatten().fieldErrors);
    }

    const { title, description, dueDate, amount, categoryId, recurrence, notificationPreference } =
      validated.data;

    const { data, error: insertError } = await supabase
      .from("reminders")
      .insert({
        user_id: user.id,
        title,
        description: description || null,
        due_date: dueDate,
        amount: amount || null,
        category_id: categoryId || null,
        recurrence,
        notification_preference: notificationPreference,
        status: "pending",
      })
      .select("*, category:categories(*)")
      .single();

    if (insertError) throw insertError;

    return successResponse(data, 201);
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : "Internal Server Error";
    return errorResponse(errorMsg, 500);
  }
}
