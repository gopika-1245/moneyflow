import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/theme-toggle";
import {
  ArrowRight,
  ShieldCheck,
  TrendingUp,
  PiggyBank,
  Sparkles,
  Repeat,
  Wallet,
  BarChart3,
  CheckCircle2,
} from "lucide-react";

export default function HomePage() {
  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground">
      {/* Navigation Header */}
      <header className="border-b border-border bg-card/60 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2.5 font-bold text-xl tracking-tight">
            <div className="h-9 w-9 rounded-xl bg-emerald-600 flex items-center justify-center text-white shadow-md shadow-emerald-500/20">
              <span className="text-lg font-black leading-none">₹</span>
            </div>
            <span className="text-xl font-extrabold tracking-tight">
              Money<span className="text-emerald-600">Flow</span>
            </span>
          </Link>

          <div className="flex items-center gap-3">
            <ThemeToggle />
            <Link href="/login">
              <Button variant="ghost" size="sm" className="font-semibold text-xs sm:text-sm">
                Sign In
              </Button>
            </Link>
            <Link href="/register">
              <Button size="sm" className="font-semibold text-xs sm:text-sm">
                Get Started
                <ArrowRight className="h-4 w-4 ml-1" />
              </Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <main className="flex-1">
        <section className="py-20 md:py-28 px-4 text-center max-w-4xl mx-auto space-y-6">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-xs font-semibold">
            <Sparkles className="h-3.5 w-3.5" />
            <span>Take Control of Your Money</span>
          </div>

          <h1 className="text-4xl sm:text-6xl font-black tracking-tight text-foreground leading-tight">
            Your Complete Financial Life in{" "}
            <span className="text-emerald-600 dark:text-emerald-500">One Intelligent Flow.</span>
          </h1>

          <p className="text-base sm:text-lg text-muted-foreground max-w-2xl mx-auto leading-relaxed">
            Track income and expenses, monitor multi-bank balances, automate recurring transactions, plan savings targets, and consult an AI assistant powered by your real data.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-4">
            <Link href="/register" className="w-full sm:w-auto">
              <Button size="lg" className="w-full sm:w-auto font-bold text-base shadow-lg shadow-emerald-600/20">
                Start Tracking Free
                <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            </Link>
            <Link href="/login" className="w-full sm:w-auto">
              <Button variant="outline" size="lg" className="w-full sm:w-auto font-semibold text-base">
                Sign In to Dashboard
              </Button>
            </Link>
          </div>

          <div className="flex items-center justify-center gap-6 pt-6 text-xs text-muted-foreground font-medium">
            <span className="flex items-center gap-1.5">
              <ShieldCheck className="h-4 w-4 text-emerald-600" /> PostgreSQL RLS Protected
            </span>
            <span className="flex items-center gap-1.5">
              <CheckCircle2 className="h-4 w-4 text-emerald-600" /> Default Currency: INR (₹)
            </span>
            <span className="flex items-center gap-1.5">
              <CheckCircle2 className="h-4 w-4 text-emerald-600" /> Vercel Serverless Ready
            </span>
          </div>
        </section>

        {/* Feature Highlights Grid */}
        <section className="py-16 bg-muted/30 border-y border-border">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center space-y-2 mb-12">
              <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
                Designed for Serious Personal Wealth Management
              </h2>
              <p className="text-sm text-muted-foreground max-w-xl mx-auto">
                No mockups, no approximations. Every balance, budget, and report is strictly computed.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="p-6 rounded-2xl border border-border bg-card shadow-sm space-y-3">
                <div className="h-10 w-10 rounded-xl bg-emerald-500/10 text-emerald-600 flex items-center justify-center">
                  <Wallet className="h-5 w-5" />
                </div>
                <h3 className="font-bold text-base">Multi-Account Management</h3>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Consolidate Savings, Current accounts, Cash, Wallets, and Credit Cards. Atomic transfers move funds instantly without distorting cash flow metrics.
                </p>
              </div>

              <div className="p-6 rounded-2xl border border-border bg-card shadow-sm space-y-3">
                <div className="h-10 w-10 rounded-xl bg-blue-500/10 text-blue-600 flex items-center justify-center">
                  <PiggyBank className="h-5 w-5" />
                </div>
                <h3 className="font-bold text-base">Budget & Goals Control</h3>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Category limits notify you at 80% and 100% consumption thresholds. Set emergency funds and dream goals with auditable contribution tracking.
                </p>
              </div>

              <div className="p-6 rounded-2xl border border-border bg-card shadow-sm space-y-3">
                <div className="h-10 w-10 rounded-xl bg-purple-500/10 text-purple-600 flex items-center justify-center">
                  <Sparkles className="h-5 w-5" />
                </div>
                <h3 className="font-bold text-base">AI Financial Assistant</h3>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Interact with an AI assistant that calculates your real spending trends, comparisons, and cash flow deterministically without hallucinations.
                </p>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-border py-8 text-center text-xs text-muted-foreground">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p>© {new Date().getFullYear()} MoneyFlow. All rights reserved.</p>
          <div className="flex items-center gap-4 text-xs font-medium">
            <Link href="/login" className="hover:text-foreground">
              Sign In
            </Link>
            <Link href="/register" className="hover:text-foreground">
              Register
            </Link>
            <Link href="/dashboard" className="text-emerald-600 hover:underline">
              Dashboard
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
