import { NextRequest } from "next/server";
import { getAuthenticatedUser, successResponse, errorResponse } from "@/lib/api-response";
import { recurringTransactionSchema } from "@/lib/validations";
import { calculateNextOccurrence } from "@/lib/calculations/finance";
import { format, parseISO } from "date-fns";

export async function GET() {
  try {
    const { supabase, user, error } = await getAuthenticatedUser();
    if (error || !user) {
      return errorResponse("Unauthorized", 401);
    }

    const { data, error: dbError } = await supabase
      .from("recurring_transactions")
      .select("*, category:categories(*), account:accounts(*)")
      .eq("user_id", user.id)
      .order("next_occurrence", { ascending: true });

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
    const validated = recurringTransactionSchema.safeParse(body);
    if (!validated.success) {
      return errorResponse("Validation failed", 422, validated.error.flatten().fieldErrors);
    }

    const {
      title,
      amount,
      type,
      categoryId,
      accountId,
      toAccountId,
      frequency,
      startDate,
      endDate,
      notes,
      isActive,
    } = validated.data;

    // Verify account ownership
    const { data: acc } = await supabase
      .from("accounts")
      .select("id")
      .eq("id", accountId)
      .eq("user_id", user.id)
      .single();

    if (!acc) {
      return errorResponse("Invalid account", 400);
    }

    const { data, error: insertError } = await supabase
      .from("recurring_transactions")
      .insert({
        user_id: user.id,
        title,
        amount,
        type,
        category_id: categoryId || null,
        account_id: accountId,
        to_account_id: toAccountId || null,
        frequency,
        start_date: startDate,
        end_date: endDate || null,
        next_occurrence: startDate,
        is_active: isActive,
        notes: notes || null,
      })
      .select("*, category:categories(*), account:accounts(*)")
      .single();

    if (insertError) throw insertError;

    return successResponse(data, 201);
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : "Internal Server Error";
    return errorResponse(errorMsg, 500);
  }
}
