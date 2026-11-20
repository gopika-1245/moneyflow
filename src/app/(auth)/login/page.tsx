"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/ui/card";
import { Input } from "@/ui/input";
import { Button } from "@/ui/button";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";
import { LogIn, ArrowRight, ShieldCheck } from "lucide-react";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectPath = searchParams.get("redirect") || "/dashboard";

  const [email, setEmail] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState("");

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const supabase = createClient();
      const { data, error: authError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (authError) {
        setError(authError.message);
        toast.error(authError.message);
        return;
      }

      if (data?.user) {
        toast.success("Welcome back!");
        router.push(redirectPath);
        router.refresh();
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to sign in";
      setError(msg);
      toast.error(msg);
    } finally {
      setLoading(false);
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
          {error && (
            <div className="p-3 text-xs rounded-lg bg-red-500/10 border border-red-500/20 text-red-600">
              {error}
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
