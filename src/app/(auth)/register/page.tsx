"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/ui/card";
import { Input } from "@/ui/input";
import { Button } from "@/ui/button";
import { toast } from "sonner";
import { UserPlus, ArrowRight, ShieldCheck } from "lucide-react";

export default function RegisterPage() {
  const router = useRouter();

  const [fullName, setFullName] = React.useState("");
  const [email, setEmail] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [confirmPassword, setConfirmPassword] = React.useState("");
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState("");
  const [registered, setRegistered] = React.useState(false);

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
          fullName,
          email,
          password,
          confirmPassword,
        }),
      });

      const json = await res.json();

      if (!res.ok || !json.success) {
        throw new Error(json.error || "Registration failed");
      }

      toast.success("Account created successfully!");
      setRegistered(true);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Registration error";
      setError(msg);
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  if (registered) {
    return (
      <Card className="w-full max-w-md shadow-xl border-border text-center p-6">
        <div className="mx-auto w-12 h-12 rounded-2xl bg-emerald-500/10 text-emerald-600 flex items-center justify-center mb-3">
          <ShieldCheck className="w-6 h-6" />
        </div>
        <CardTitle className="text-xl font-bold">Account Created</CardTitle>
        <CardDescription className="mt-2 text-sm">
          Welcome to MoneyFlow! If email confirmation is enabled on your Supabase project, please check your inbox to verify your email. Otherwise, you can log in right away.
        </CardDescription>
        <div className="mt-6">
          <Button onClick={() => router.push("/login")} className="w-full">
            Proceed to Login
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
