import { NextRequest } from "next/server";
import { getAuthenticatedUser, successResponse, errorResponse } from "@/lib/api-response";
import { categorySchema } from "@/lib/validations";

export async function GET(request: NextRequest) {
  try {
    const { supabase, user, error } = await getAuthenticatedUser();
    if (error || !user) {
      return errorResponse("Unauthorized", 401);
    }

    const { searchParams } = new URL(request.url);
    const type = searchParams.get("type");

    let query = supabase
      .from("categories")
      .select("*")
      .or(`user_id.is.null,user_id.eq.${user.id}`)
      .order("name", { ascending: true });

    if (type && (type === "income" || type === "expense")) {
      query = query.eq("type", type);
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
    const validated = categorySchema.safeParse(body);
    if (!validated.success) {
      return errorResponse("Validation failed", 422, validated.error.flatten().fieldErrors);
    }

    const { name, type, icon, color } = validated.data;

    const { data, error: insertError } = await supabase
      .from("categories")
      .insert({
        user_id: user.id,
        name,
        type,
        icon,
        color,
        is_system: false,
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
