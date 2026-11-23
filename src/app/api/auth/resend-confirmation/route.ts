import { NextRequest } from "next/server";
import { z } from "zod";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { successResponse, errorResponse } from "@/lib/api-response";

const resendSchema = z.object({
  email: z.string().email("Invalid email address"),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validated = resendSchema.safeParse(body);

    if (!validated.success) {
      return errorResponse("Please enter a valid email address.", 422);
    }

    const { email } = validated.data;
    const origin =
      request.headers.get("origin") ||
      process.env.NEXT_PUBLIC_APP_URL ||
      "https://moneyflow-fdzb.vercel.app";
    const emailRedirectTo = `${origin}/auth/callback`;

    const supabase = createServerSupabaseClient();
    const { error } = await supabase.auth.resend({
      type: "signup",
      email,
      options: {
        emailRedirectTo,
      },
    });

    if (error) {
      // If Supabase rate-limits or throws error
      let msg = error.message;
      if (error.message.toLowerCase().includes("rate limit") || error.message.toLowerCase().includes("too many requests")) {
        msg = "Too many requests. Please wait a minute before requesting another confirmation email.";
      }
      return errorResponse(msg, 400);
    }

    return successResponse(
      {
        message: "Verification email resent successfully! Please check your inbox and spam folder.",
      },
      200
    );
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Failed to resend confirmation email";
    return errorResponse(msg, 500);
  }
}
