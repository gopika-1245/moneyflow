import { NextRequest } from "next/server";
import { registerSchema } from "@/lib/validations";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { successResponse, errorResponse } from "@/lib/api-response";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validated = registerSchema.safeParse(body);

    if (!validated.success) {
      return errorResponse("Validation failed", 422, validated.error.flatten().fieldErrors);
    }

    const { fullName, email, password } = validated.data;
    const supabase = createServerSupabaseClient();

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName,
        },
      },
    });

    if (error) {
      return errorResponse(error.message, 400);
    }

    return successResponse(
      {
        user: data.user,
        session: data.session,
        message: "Registration successful",
      },
      201
    );
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : "Internal Server Error";
    return errorResponse(errorMsg, 500);
  }
}
