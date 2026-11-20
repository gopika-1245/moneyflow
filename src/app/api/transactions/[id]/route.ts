import { NextRequest } from "next/server";
import { getAuthenticatedUser, successResponse, errorResponse } from "@/lib/api-response";
import { z } from "zod";

const updateTransactionSchema = z.object({
  title: z.string().min(1).max(150).optional(),
  description: z.string().max(500).optional().nullable(),
  amount: z.number().positive().optional(),
  type: z.enum(["income", "expense", "transfer"]).optional(),
  categoryId: z.string().uuid().optional().nullable(),
  accountId: z.string().uuid().optional(),
  toAccountId: z.string().uuid().optional().nullable(),
  date: z.string().optional(),
  paymentMethod: z.string().max(50).optional().nullable(),
  notes: z.string().max(1000).optional().nullable(),
});

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { supabase, user, error } = await getAuthenticatedUser();
    if (error || !user) {
      return errorResponse("Unauthorized", 401);
    }

    const { data, error: dbError } = await supabase
      .from("transactions")
      .select("*, category:categories(*), account:accounts(*), to_account:accounts!transactions_to_account_id_fkey(*)")
      .eq("id", params.id)
      .eq("user_id", user.id)
      .single();

    if (dbError || !data) {
      return errorResponse("Transaction not found", 404);
    }

    return successResponse(data);
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
    const validated = updateTransactionSchema.safeParse(body);
    if (!validated.success) {
      return errorResponse("Validation failed", 422, validated.error.flatten().fieldErrors);
    }

    const updates: any = {
      updated_at: new Date().toISOString(),
    };
    if (validated.data.title !== undefined) updates.title = validated.data.title;
    if (validated.data.description !== undefined) updates.description = validated.data.description;
    if (validated.data.amount !== undefined) updates.amount = validated.data.amount;
    if (validated.data.type !== undefined) updates.type = validated.data.type;
    if (validated.data.categoryId !== undefined) updates.category_id = validated.data.categoryId;
    if (validated.data.accountId !== undefined) updates.account_id = validated.data.accountId;
    if (validated.data.toAccountId !== undefined) updates.to_account_id = validated.data.toAccountId;
    if (validated.data.date !== undefined) updates.date = validated.data.date;
    if (validated.data.paymentMethod !== undefined) updates.payment_method = validated.data.paymentMethod;
    if (validated.data.notes !== undefined) updates.notes = validated.data.notes;

    const { data, error: updateError } = await supabase
      .from("transactions")
      .update(updates)
      .eq("id", params.id)
      .eq("user_id", user.id)
      .select("*, category:categories(*), account:accounts(*)")
      .single();

    if (updateError || !data) {
      return errorResponse("Failed to update transaction", 400);
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

    // Deleting triggers `handle_transaction_balance_change` to safely restore account balance!
    const { error: deleteError } = await supabase
      .from("transactions")
      .delete()
      .eq("id", params.id)
      .eq("user_id", user.id);

    if (deleteError) throw deleteError;

    return successResponse({ message: "Transaction deleted successfully" });
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : "Internal Server Error";
    return errorResponse(errorMsg, 500);
  }
}
