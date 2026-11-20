"use client";

import * as React from "react";
import Link from "next/link";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/ui/card";
import { Input } from "@/ui/input";
import { Button } from "@/ui/button";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";
import { KeyRound, ArrowLeft, Send } from "lucide-react";

export default function ForgotPasswordPage() {
  const [email, setEmail] = React.useState("");
  const [loading, setLoading] = React.useState(false);
  const [sent, setSent] = React.useState(false);

  const handleResetRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const supabase = createClient();
      const origin = window.location.origin;
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${origin}/reset-password`,
      });

      if (error) {
        toast.error(error.message);
        return;
      }

      setSent(true);
      toast.success("Password reset instructions sent to your email");
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Error sending reset email";
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="w-full max-w-md shadow-xl border-border">
      <CardHeader className="space-y-1 text-center">
        <div className="mx-auto w-12 h-12 rounded-2xl bg-emerald-500/10 text-emerald-600 flex items-center justify-center mb-2">
          <KeyRound className="w-6 h-6" />
        </div>
        <CardTitle className="text-2xl font-bold tracking-tight">Reset Password</CardTitle>
        <CardDescription>
          Enter your registered email address and we&apos;ll send you a password recovery link.
        </CardDescription>
      </CardHeader>

      {sent ? (
        <CardContent className="space-y-4 text-center">
          <div className="p-4 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-700 dark:text-emerald-300 text-sm">
            We have sent a password reset link to <strong>{email}</strong>. Please check your inbox and spam folder.
          </div>
          <Button variant="outline" className="w-full" onClick={() => setSent(false)}>
            Try another email
          </Button>
        </CardContent>
      ) : (
        <form onSubmit={handleResetRequest}>
          <CardContent className="space-y-4">
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

            <Button type="submit" className="w-full font-semibold" isLoading={loading}>
              <Send className="w-4 h-4 mr-1.5" />
              Send Recovery Link
            </Button>
          </CardContent>
        </form>
      )}

      <CardFooter className="flex justify-center border-t border-border pt-4">
        <Link
          href="/login"
          className="text-xs text-muted-foreground hover:text-foreground inline-flex items-center gap-1.5 font-medium"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          Back to Login
        </Link>
      </CardFooter>
    </Card>
  );
}
