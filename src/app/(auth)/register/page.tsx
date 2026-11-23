"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/ui/card";
import { Input } from "@/ui/input";
import { Button } from "@/ui/button";
import { toast } from "sonner";
import { UserPlus, ArrowRight, ShieldCheck, Mail, RefreshCw, LogIn } from "lucide-react";

export default function RegisterPage() {
  const router = useRouter();

  const [fullName, setFullName] = React.useState("");
  const [email, setEmail] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [confirmPassword, setConfirmPassword] = React.useState("");
  const [loading, setLoading] = React.useState(false);
  const [resending, setResending] = React.useState(false);
  const [resendCooldown, setResendCooldown] = React.useState(0);
  const [error, setError] = React.useState("");
  const [registeredEmail, setRegisteredEmail] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (resendCooldown <= 0) return;
    const timer = setTimeout(() => setResendCooldown((prev) => prev - 1), 1000);
    return () => clearTimeout(timer);
  }, [resendCooldown]);

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (password !== confirmPassword) {
      setError("Passwords do not match");
      toast.error("Passwords do not match");
      return;
    }

    if (password.length < 8) {
      setError("Password must be at least 8 characters");
      toast.error("Password must be at least 8 characters");
      return;
    }

    setLoading(true);

    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fullName: fullName.trim(),
          email: email.trim(),
          password,
          confirmPassword,
        }),
      });

      const json = await res.json();

      if (!res.ok || !json.success) {
        throw new Error(json.error || "Registration failed");
      }

      // If Supabase has email confirmation disabled, user gets instant session
      if (json.data?.session && !json.data?.requiresEmailConfirmation) {
        toast.success("Account created successfully! Welcome to MoneyFlow.");
        router.push("/dashboard");
        router.refresh();
        return;
      }

      // If email confirmation is enabled (default on Supabase projects)
      toast.success("Account created! Please check your email to verify your account.");
      setRegisteredEmail(email.trim());
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Registration error";
      setError(msg);
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleResendConfirmation = async () => {
    if (!registeredEmail) return;
    setResending(true);
    try {
      const res = await fetch("/api/auth/resend-confirmation", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: registeredEmail }),
      });
      const json = await res.json();

      if (!res.ok || !json.success) {
        throw new Error(json.error || "Failed to resend confirmation email.");
      }

      toast.success("A new verification link has been sent to your email!");
      setResendCooldown(60);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Error resending confirmation";
      toast.error(msg);
    } finally {
      setResending(false);
    }
  };

  if (registeredEmail) {
    return (
      <Card className="w-full max-w-md shadow-xl border-border text-center p-6 space-y-4">
        <div className="mx-auto w-14 h-14 rounded-2xl bg-emerald-500/10 text-emerald-600 flex items-center justify-center mb-1">
          <Mail className="w-7 h-7" />
        </div>
        <CardTitle className="text-2xl font-bold tracking-tight">Verify Your Email</CardTitle>
        <CardDescription className="text-sm leading-relaxed text-muted-foreground">
          We&apos;ve sent a verification link to <strong className="text-foreground">{registeredEmail}</strong>.
          Please check your inbox (and spam folder) and click the confirmation link to activate your MoneyFlow account.
        </CardDescription>

        <div className="p-4 rounded-xl bg-muted/60 border border-border text-left text-xs space-y-2">
          <div className="flex items-center gap-2 font-semibold text-foreground">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            Why is verification required?
          </div>
          <p className="text-muted-foreground leading-relaxed">
            To protect your financial records and ensure that only you can access your accounts and balance history.
          </p>
        </div>

        <div className="pt-2 space-y-2.5">
          <Button
            variant="outline"
            onClick={handleResendConfirmation}
            disabled={resending || resendCooldown > 0}
            className="w-full font-medium"
          >
            {resending ? (
              <>
                <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                Resending Email...
              </>
            ) : resendCooldown > 0 ? (
              `Resend available in ${resendCooldown}s`
            ) : (
              "Resend Verification Email"
            )}
          </Button>

          <Button onClick={() => router.push("/login")} className="w-full font-semibold">
            <LogIn className="w-4 h-4 mr-2" />
            Proceed to Sign In
          </Button>
        </div>
      </Card>
    );
  }

  return (
    <Card className="w-full max-w-md shadow-xl border-border">
      <CardHeader className="space-y-1 text-center">
        <div className="mx-auto w-12 h-12 rounded-2xl bg-emerald-500/10 text-emerald-600 flex items-center justify-center mb-2">
          <UserPlus className="w-6 h-6" />
        </div>
        <CardTitle className="text-2xl font-bold tracking-tight">Create your Account</CardTitle>
        <CardDescription>
          Take control of your money with our unified wealth platform.
        </CardDescription>
      </CardHeader>

      <form onSubmit={handleRegister}>
        <CardContent className="space-y-3.5">
          {error && (
            <div className="p-3 text-xs rounded-lg bg-red-500/10 border border-red-500/20 text-red-600">
              {error}
            </div>
          )}

          <div className="space-y-1">
            <label className="text-xs font-semibold text-muted-foreground">Full Name</label>
            <Input
              placeholder="e.g. Rahul Sharma"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              required
            />
          </div>

          <div className="space-y-1">
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

          <div className="space-y-1">
            <label className="text-xs font-semibold text-muted-foreground">Password (min 8 characters)</label>
            <Input
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={8}
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs font-semibold text-muted-foreground">Confirm Password</label>
            <Input
              type="password"
              placeholder="••••••••"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              minLength={8}
            />
          </div>

          <Button type="submit" className="w-full font-semibold mt-2" isLoading={loading}>
            Create MoneyFlow Account
            <ArrowRight className="w-4 h-4 ml-1.5" />
          </Button>

          <p className="text-[11px] text-center text-muted-foreground">
            By signing up, you agree to our Terms and Privacy Standards.
          </p>
        </CardContent>

        <CardFooter className="flex justify-center border-t border-border pt-4">
          <p className="text-xs text-muted-foreground">
            Already have an account?{" "}
            <Link href="/login" className="text-emerald-600 font-semibold hover:underline">
              Sign In
            </Link>
          </p>
        </CardFooter>
      </form>
    </Card>
  );
}
