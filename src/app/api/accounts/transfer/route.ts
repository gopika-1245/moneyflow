import { NextRequest } from "next/server";
import { getAuthenticatedUser, successResponse, errorResponse } from "@/lib/api-response";
import { transferSchema } from "@/lib/validations";

export async function POST(request: NextRequest) {
  try {
    const { supabase, user, error } = await getAuthenticatedUser();
    if (error || !user) {
      return errorResponse("Unauthorized", 401);
    }

    const body = await request.json();
    const validated = transferSchema.safeParse(body);
    if (!validated.success) {
      return errorResponse("Validation failed", 422, validated.error.flatten().fieldErrors);
    }

    const { fromAccountId, toAccountId, amount, date, notes } = validated.data;

    // Verify source account ownership & funds
    const { data: sourceAcc, error: srcError } = await supabase
      .from("accounts")
      .select("*")
      .eq("id", fromAccountId)
      .eq("user_id", user.id)
      .single();

    if (srcError || !sourceAcc) {
      return errorResponse("Source account not found", 404);
    }

    // Verify destination account ownership
    const { data: destAcc, error: dstError } = await supabase
      .from("accounts")
      .select("*")
      .eq("id", toAccountId)
      .eq("user_id", user.id)
      .single();

    if (dstError || !destAcc) {
      return errorResponse("Destination account not found", 404);
    }

    // Check balance if source is a cash or savings account
    if (sourceAcc.type === "cash" || sourceAcc.type === "wallet" || sourceAcc.type === "savings") {
      if (Number(sourceAcc.current_balance) < amount) {
        return errorResponse(
          `Insufficient funds in ${sourceAcc.name}. Available: ${sourceAcc.currency} ${Number(sourceAcc.current_balance).toFixed(2)}`,
          400
        );
      }
    }

    // Insert atomic transfer transaction record
    // The database trigger `handle_transaction_balance_change` will deduct from fromAccountId and add to toAccountId!
    const { data: transaction, error: txError } = await supabase
      .from("transactions")
      .insert({
        user_id: user.id,
        title: `Transfer: ${sourceAcc.name} → ${destAcc.name}`,
        description: `Funds transfer from ${sourceAcc.name} to ${destAcc.name}`,
        amount,
        type: "transfer",
        account_id: fromAccountId,
        to_account_id: toAccountId,
        date,
        notes,
      })
      .select()
      .single();

    if (txError) {
      return errorResponse(`Failed to execute transfer: ${txError.message}`, 400);
    }

    return successResponse({
      message: "Transfer completed successfully",
      transaction,
    }, 201);
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : "Internal Server Error";
    return errorResponse(errorMsg, 500);
  }
}
