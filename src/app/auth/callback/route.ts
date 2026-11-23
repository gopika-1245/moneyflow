import { NextResponse, type NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next") ?? "/dashboard";
  const error = searchParams.get("error");
  const errorDescription = searchParams.get("error_description");

  // Handle errors passed directly from Supabase (e.g. expired link)
  if (error || errorDescription) {
    const errorMsg = encodeURIComponent(
      errorDescription || error || "Verification link expired or invalid"
    );
    return NextResponse.redirect(`${origin}/login?error=${errorMsg}`);
  }

  if (code) {
    const cookieStore = cookies();
    const supabaseUrl =
      process.env.SUPABASE_URL ||
      process.env.NEXT_PUBLIC_SUPABASE_URL ||
      "https://kkgudfmcxzwqwotzgocj.supabase.co";
    const supabaseKey =
      process.env.SUPABASE_PUBLISHABLE_KEY ||
      process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
      "";

    const supabase = createServerClient(supabaseUrl, supabaseKey, {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet: Array<{ name: string; value: string; options?: any }>) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch {
            // The `setAll` method was called from a Server Component.
          }
        },
      },
    });

    const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);
    if (!exchangeError) {
      // Validate redirect destination to prevent open-redirect vulnerabilities
      const targetPath = next.startsWith("/") && !next.startsWith("//") ? next : "/dashboard";
      return NextResponse.redirect(`${origin}${targetPath}`);
    }
  }

  // If code exchange failed or no code was present
  return NextResponse.redirect(
    `${origin}/login?error=${encodeURIComponent(
      "Email verification link expired or invalid. Please sign in or request a new confirmation email."
    )}`
  );
}
