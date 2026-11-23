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

    const origin =
      request.headers.get("origin") ||
      process.env.NEXT_PUBLIC_APP_URL ||
      "https://moneyflow-fdzb.vercel.app";
    const emailRedirectTo = `${origin}/auth/callback`;

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo,
        data: {
          full_name: fullName,
        },
      },
    });

    if (error) {
      let message = error.message;
      if (
        error.message.toLowerCase().includes("already registered") ||
        error.message.toLowerCase().includes("already in use") ||
        error.message.toLowerCase().includes("user already exists")
      ) {
        message = "An account with this email address already exists. Please log in instead.";
      }
      return errorResponse(message, 400);
    }

    // Determine if confirmation email was sent or session was auto-confirmed
    const requiresEmailConfirmation = Boolean(data.user && !data.session);

    return successResponse(
      {
        user: data.user,
        session: data.session,
        requiresEmailConfirmation,
        message: requiresEmailConfirmation
          ? "Account created. Please verify your email before logging in."
          : "Registration successful",
      },
      201
    );
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : "Internal Server Error";
    return errorResponse(errorMsg, 500);
  }
}
