import { NextRequest } from "next/server";
import { getAuthenticatedUser, successResponse, errorResponse } from "@/lib/api-response";
import { z } from "zod";

const updateAccountSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  type: z.enum(["cash", "savings", "current", "credit_card", "wallet", "other"]).optional(),
  institutionName: z.string().max(100).optional().nullable(),
  description: z.string().max(500).optional().nullable(),
  isArchived: z.boolean().optional(),
});

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { supabase, user, error } = await getAuthenticatedUser();
    if (error || !user) {
      return errorResponse("Unauthorized", 401);
    }

    const { data, error: dbError } = await supabase
      .from("accounts")
      .select("*")
      .eq("id", params.id)
      .eq("user_id", user.id)
      .single();

    if (dbError || !data) {
      return errorResponse("Account not found", 404);
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
    const validated = updateAccountSchema.safeParse(body);
    if (!validated.success) {
      return errorResponse("Validation failed", 422, validated.error.flatten().fieldErrors);
    }

    const updates: any = {
      updated_at: new Date().toISOString(),
    };
    if (validated.data.name !== undefined) updates.name = validated.data.name;
    if (validated.data.type !== undefined) updates.type = validated.data.type;
    if (validated.data.institutionName !== undefined) updates.institution_name = validated.data.institutionName;
    if (validated.data.description !== undefined) updates.description = validated.data.description;
    if (validated.data.isArchived !== undefined) updates.is_archived = validated.data.isArchived;

    const { data, error: updateError } = await supabase
      .from("accounts")
      .update(updates)
      .eq("id", params.id)
      .eq("user_id", user.id)
      .select()
      .single();

    if (updateError || !data) {
      return errorResponse("Failed to update account", 400);
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

    // Check if account has transactions
    const { count, error: countError } = await supabase
      .from("transactions")
      .select("id", { count: "exact", head: true })
      .eq("account_id", params.id);

    if (countError) throw countError;

    if (count && count > 0) {
      // If transactions exist, prefer archiving to protect data integrity, or allow soft archive
      return errorResponse("Cannot delete account with existing transactions. Please archive it instead.", 400);
    }

    const { error: deleteError } = await supabase
      .from("accounts")
      .delete()
      .eq("id", params.id)
      .eq("user_id", user.id);

    if (deleteError) throw deleteError;

    return successResponse({ message: "Account deleted successfully" });
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : "Internal Server Error";
    return errorResponse(errorMsg, 500);
  }
}
