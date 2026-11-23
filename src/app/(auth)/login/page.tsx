"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/ui/card";
import { Input } from "@/ui/input";
import { Button } from "@/ui/button";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";
import { LogIn, ArrowRight, ShieldCheck, Mail, AlertCircle, RefreshCw } from "lucide-react";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectPath = searchParams.get("redirect") || "/dashboard";
  const urlError = searchParams.get("error");
  const urlVerified = searchParams.get("verified");

  const [email, setEmail] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [loading, setLoading] = React.useState(false);
  const [resending, setResending] = React.useState(false);
  const [resendCooldown, setResendCooldown] = React.useState(0);
  const [error, setError] = React.useState("");
  const [isEmailUnconfirmed, setIsEmailUnconfirmed] = React.useState(false);

  React.useEffect(() => {
    if (urlError) {
      setError(decodeURIComponent(urlError));
    }
    if (urlVerified) {
      toast.success("Email verified successfully! You can now sign in.");
    }
  }, [urlError, urlVerified]);

  React.useEffect(() => {
    if (resendCooldown <= 0) return;
    const timer = setTimeout(() => setResendCooldown((prev) => prev - 1), 1000);
    return () => clearTimeout(timer);
  }, [resendCooldown]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsEmailUnconfirmed(false);
    setLoading(true);

    try {
      const supabase = createClient();
      const { data, error: authError } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });

      if (authError) {
        const rawMsg = authError.message.toLowerCase();

        if (rawMsg.includes("email not confirmed")) {
          setIsEmailUnconfirmed(true);
          setError("Your email address has not been confirmed yet.");
          return;
        }

        if (rawMsg.includes("invalid login credentials") || rawMsg.includes("invalid_credentials")) {
          setError("Invalid email or password. Please try again.");
          return;
        }

        if (rawMsg.includes("network") || rawMsg.includes("fetch")) {
          setError("Connection error. Please check your network and try again.");
          return;
        }

        setError("Unable to sign in. Please verify your credentials and try again.");
        return;
      }

      if (data?.user) {
        toast.success("Welcome back to MoneyFlow!");
        router.push(redirectPath);
        router.refresh();
      }
    } catch {
      setError("An unexpected error occurred. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleResendConfirmation = async () => {
    if (!email || !email.includes("@")) {
      toast.error("Please enter your email address to receive a confirmation link.");
      return;
    }

    setResending(true);
    try {
      const res = await fetch("/api/auth/resend-confirmation", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim() }),
      });
      const json = await res.json();

      if (!res.ok || !json.success) {
        throw new Error(json.error || "Failed to resend confirmation email.");
      }

      toast.success("Confirmation email resent! Please check your inbox and spam folder.");
      setResendCooldown(60);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Error resending confirmation email";
      toast.error(msg);
    } finally {
      setResending(false);
    }
  };

  return (
    <Card className="w-full max-w-md shadow-xl border-border">
      <CardHeader className="space-y-1 text-center">
        <div className="mx-auto w-12 h-12 rounded-2xl bg-emerald-500/10 text-emerald-600 flex items-center justify-center mb-2">
          <LogIn className="w-6 h-6" />
        </div>
        <CardTitle className="text-2xl font-bold tracking-tight">Welcome to MoneyFlow</CardTitle>
        <CardDescription>
          Enter your email and password to access your financial portfolio.
        </CardDescription>
      </CardHeader>

      <form onSubmit={handleLogin}>
        <CardContent className="space-y-4">
          {isEmailUnconfirmed && (
            <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/25 text-amber-900 dark:text-amber-200 text-xs space-y-3">
              <div className="flex items-start gap-2.5">
                <Mail className="w-4 h-4 text-amber-600 dark:text-amber-400 mt-0.5 shrink-0" />
                <div className="space-y-1">
                  <p className="font-semibold text-sm text-amber-800 dark:text-amber-300">
                    Email Verification Required
                  </p>
                  <p className="leading-relaxed">
                    A confirmation email was sent to <strong>{email}</strong> when your account was created. Please check your inbox (and spam folder) and click the confirmation link to activate your account.
                  </p>
                </div>
              </div>

              <div className="pt-1 border-t border-amber-500/20 flex items-center justify-between">
                <span className="text-[11px] text-amber-700/80 dark:text-amber-300/80">
                  Didn&apos;t receive it?
                </span>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  disabled={resending || resendCooldown > 0}
                  onClick={handleResendConfirmation}
                  className="h-8 text-xs font-medium border-amber-500/30 hover:bg-amber-500/15"
                >
                  {resending ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 mr-1.5 animate-spin" />
                      Sending...
                    </>
                  ) : resendCooldown > 0 ? (
                    `Resend in ${resendCooldown}s`
                  ) : (
                    "Resend Email"
                  )}
                </Button>
              </div>
            </div>
          )}

          {error && !isEmailUnconfirmed && (
            <div className="p-3 text-xs rounded-lg bg-red-500/10 border border-red-500/20 text-red-600 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-muted-foreground">Email Address</label>
            <Input
              type="email"
              placeholder="name@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoComplete="email"
            />
          </div>

          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold text-muted-foreground">Password</label>
              <Link
                href="/forgot-password"
                className="text-xs text-emerald-600 hover:underline font-medium"
              >
                Forgot password?
              </Link>
            </div>
            <Input
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              autoComplete="current-password"
            />
          </div>

          <Button type="submit" className="w-full font-semibold" isLoading={loading}>
            Sign In to MoneyFlow
            <ArrowRight className="w-4 h-4 ml-1.5" />
          </Button>

          <div className="flex items-center justify-center gap-1.5 text-[11px] text-muted-foreground pt-1">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
            End-to-end encrypted session
          </div>
        </CardContent>

        <CardFooter className="flex justify-center border-t border-border pt-4">
          <p className="text-xs text-muted-foreground">
            Don&apos;t have an account?{" "}
            <Link href="/register" className="text-emerald-600 font-semibold hover:underline">
              Create an account
            </Link>
          </p>
        </CardFooter>
      </form>
    </Card>
  );
}

export default function LoginPage() {
  return (
    <React.Suspense fallback={<div className="p-6 text-sm text-center text-muted-foreground">Loading MoneyFlow...</div>}>
      <LoginForm />
    </React.Suspense>
  );
}
