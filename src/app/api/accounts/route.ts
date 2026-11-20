import { NextRequest } from "next/server";
import { getAuthenticatedUser, successResponse, errorResponse } from "@/lib/api-response";
import { accountSchema } from "@/lib/validations";

export async function GET() {
  try {
    const { supabase, user, error } = await getAuthenticatedUser();
    if (error || !user) {
      return errorResponse("Unauthorized", 401);
    }

    const { data, error: dbError } = await supabase
      .from("accounts")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: true });

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
    const validated = accountSchema.safeParse(body);

    if (!validated.success) {
      return errorResponse("Validation failed", 422, validated.error.flatten().fieldErrors);
    }

    const { name, type, openingBalance, currency, institutionName, description } = validated.data;

    const { data, error: insertError } = await supabase
      .from("accounts")
      .insert({
        user_id: user.id,
        name,
        type,
        opening_balance: openingBalance,
        current_balance: openingBalance,
        currency,
        institution_name: institutionName,
        description,
      })
      .select()
      .single();

    if (insertError) throw insertError;

    return successResponse(data, 201);
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : "Internal Server Error";
    return errorResponse(errorMsg, 500);
  }
}
