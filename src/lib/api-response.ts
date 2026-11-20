import { NextResponse } from "next/server";
import { createServerSupabaseClient } from "./supabase/server";

export function successResponse<T>(data: T, status = 200) {
  return NextResponse.json({ success: true, data }, { status });
}

export function errorResponse(message: string, status = 400, errors?: unknown) {
  return NextResponse.json(
    {
      success: false,
      error: message,
      ...(errors ? { details: errors } : {}),
    },
    { status }
  );
}

/**
 * Authenticates request and returns the Supabase client and User object.
 * Throws or returns 401 response if unauthenticated.
 */
export async function getAuthenticatedUser() {
  const supabase = createServerSupabaseClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) {
    return { supabase, user: null, error: "Unauthorized" };
  }

  return { supabase, user, error: null };
}
