"use client";

import * as React from "react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/ui/card";
import { Button } from "@/ui/button";
import { Badge } from "@/ui/badge";
import { Skeleton } from "@/ui/skeleton";
import { formatCurrency, formatDate } from "@/lib/utils";
import {
  Wallet,
  TrendingUp,
  TrendingDown,
  PiggyBank,
  ArrowUpRight,
  ArrowDownRight,
  ArrowLeftRight,
  Calendar,
  AlertTriangle,
  Clock,
  Sparkles,
  ChevronRight,
  Plus,
} from "lucide-react";
import Link from "next/link";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import { QuickAddModal } from "@/components/layout/quick-add-modal";

export default function DashboardPage() {
  const [filter, setFilter] = React.useState("this_month");
  const [loading, setLoading] = React.useState(true);
  const [dashboardData, setDashboardData] = React.useState<any>(null);
  const [quickAddOpen, setQuickAddOpen] = React.useState(false);

  const loadData = React.useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/dashboard/summary?filter=${filter}`);
      const json = await res.json();
      if (json.success && json.data) {
        setDashboardData(json.data);
      }
    } catch {
    } finally {
      setLoading(false);
    }
  }, [filter]);

  React.useEffect(() => {
    loadData();
  }, [loadData]);

  const summary = dashboardData?.summary || {
    totalBalance: 0,
    totalAssets: 0,
    totalLiabilities: 0,
    monthlyIncome: 0,
    monthlyExpenses: 0,
    monthlySavings: 0,
    savingsRate: 0,
    periodLabel: "This Month",
  };

  const recentTransactions = dashboardData?.recentTransactions || [];
  const budgets = dashboardData?.budgets || [];
  const savingsGoals = dashboardData?.savingsGoals || [];
  const upcomingReminders = dashboardData?.upcomingReminders || [];
  const upcomingRecurring = dashboardData?.upcomingRecurring || [];
  const accounts = dashboardData?.accounts || [];

  // Chart data: Income vs Expense bar
  const cashFlowComparison = [
    { name: "Income", amount: summary.monthlyIncome, fill: "#10b981" },
    { name: "Expenses", amount: summary.monthlyExpenses, fill: "#ef4444" },
    { name: "Savings", amount: Math.max(0, summary.monthlySavings), fill: "#3b82f6" },
  ];

  // Account distribution for pie chart
  const accountPieData = accounts.map((acc: any) => ({
    name: acc.name,
    value: Math.max(0, Number(acc.current_balance)),
  }));

  const COLORS = ["#10b981", "#3b82f6", "#f59e0b", "#ec4899", "#8b5cf6", "#06b6d4"];

  return (
    <div className="space-y-6">
      {/* Header and Filter Selector */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground">
            Financial Overview
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Monitor real-time cash flow, balances, and budget utilization.
          </p>
        </div>

        {/* Filter Pills */}
        <div className="flex items-center gap-1.5 p-1 bg-card border border-border rounded-xl shadow-sm overflow-x-auto text-xs">
          {[
            { id: "this_week", label: "Week" },
            { id: "this_month", label: "This Month" },
            { id: "last_month", label: "Last Month" },
            { id: "last_3_months", label: "3 Months" },
            { id: "this_year", label: "This Year" },
          ].map((f) => (
            <button
              key={f.id}
              onClick={() => setFilter(f.id)}
              className={`px-3 py-1.5 rounded-lg font-medium transition-colors whitespace-nowrap ${
                filter === f.id
                  ? "bg-emerald-600 text-white font-semibold shadow-sm"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted"
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* KPI 1: Total Balance */}
        <Card className="hover:border-emerald-500/40 transition-colors">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Total Net Balance
            </CardTitle>
            <div className="h-8 w-8 rounded-lg bg-emerald-500/10 text-emerald-600 flex items-center justify-center">
              <Wallet className="h-4 w-4" />
            </div>
          </CardHeader>
          <CardContent>
            {loading ? (
              <Skeleton className="h-8 w-32 my-1" />
            ) : (
              <div className="text-2xl font-black text-foreground">
                {formatCurrency(summary.totalBalance)}
              </div>
            )}
            <div className="flex items-center justify-between text-[11px] text-muted-foreground mt-2">
              <span>Assets: {formatCurrency(summary.totalAssets)}</span>
              <span>Dues: {formatCurrency(summary.totalLiabilities)}</span>
            </div>
          </CardContent>
        </Card>

        {/* KPI 2: Period Income */}
        <Card className="hover:border-emerald-500/40 transition-colors">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              {summary.periodLabel} Income
            </CardTitle>
            <div className="h-8 w-8 rounded-lg bg-emerald-500/10 text-emerald-600 flex items-center justify-center">
              <TrendingUp className="h-4 w-4" />
            </div>
          </CardHeader>
          <CardContent>
            {loading ? (
              <Skeleton className="h-8 w-32 my-1" />
            ) : (
              <div className="text-2xl font-black text-emerald-600 dark:text-emerald-400">
                {formatCurrency(summary.monthlyIncome)}
              </div>
            )}
            <p className="text-[11px] text-muted-foreground mt-2">Earned across qualifying accounts</p>
          </CardContent>
        </Card>

        {/* KPI 3: Period Expenses */}
        <Card className="hover:border-red-500/40 transition-colors">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              {summary.periodLabel} Expenses
            </CardTitle>
            <div className="h-8 w-8 rounded-lg bg-red-500/10 text-red-600 flex items-center justify-center">
              <TrendingDown className="h-4 w-4" />
            </div>
          </CardHeader>
          <CardContent>
            {loading ? (
              <Skeleton className="h-8 w-32 my-1" />
            ) : (
              <div className="text-2xl font-black text-red-600 dark:text-red-400">
                {formatCurrency(summary.monthlyExpenses)}
              </div>
            )}
            <p className="text-[11px] text-muted-foreground mt-2">Excluding transfers between accounts</p>
          </CardContent>
        </Card>

        {/* KPI 4: Net Savings */}
        <Card className="hover:border-blue-500/40 transition-colors">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Net Savings & Rate
            </CardTitle>
            <div className="h-8 w-8 rounded-lg bg-blue-500/10 text-blue-600 flex items-center justify-center">
              <PiggyBank className="h-4 w-4" />
            </div>
          </CardHeader>
          <CardContent>
            {loading ? (
              <Skeleton className="h-8 w-32 my-1" />
            ) : (
              <div className="text-2xl font-black text-foreground">
                {formatCurrency(summary.monthlySavings)}
              </div>
            )}
            <div className="flex items-center gap-1.5 mt-2">
              <Badge variant={summary.savingsRate >= 20 ? "success" : "secondary"}>
                {summary.savingsRate}% Savings Rate
              </Badge>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Grid: Charts + Recent Transactions */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Cash Flow Bar Chart */}
        <Card className="lg:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between pb-4">
            <div>
              <CardTitle className="text-base font-bold">Cash Flow Comparison</CardTitle>
              <CardDescription>Income versus Expenses for {summary.periodLabel}</CardDescription>
            </div>
            <Link
              href="/analytics"
              className="text-xs font-medium text-emerald-600 hover:underline flex items-center gap-1"
            >
              Full Analytics <ChevronRight className="h-3.5 w-3.5" />
            </Link>
          </CardHeader>
          <CardContent>
            {loading ? (
              <Skeleton className="h-64 w-full" />
            ) : summary.monthlyIncome === 0 && summary.monthlyExpenses === 0 ? (
              <div className="h-64 flex flex-col items-center justify-center text-center p-6 border border-dashed rounded-xl border-border">
                <Calendar className="h-8 w-8 text-muted-foreground mb-2" />
                <p className="font-semibold text-sm">No transactions in this period</p>
                <p className="text-xs text-muted-foreground max-w-sm mt-1">
                  Click &ldquo;Add Transaction&rdquo; above to record income or expenses.
                </p>
                <Button size="sm" onClick={() => setQuickAddOpen(true)} className="mt-4">
                  <Plus className="h-4 w-4 mr-1.5" /> Add Transaction
                </Button>
              </div>
            ) : (
              <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={cashFlowComparison} margin={{ top: 20, right: 20, left: -10, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" opacity={0.15} />
                    <XAxis dataKey="name" stroke="#888888" fontSize={12} tickLine={false} />
                    <YAxis
                      stroke="#888888"
                      fontSize={11}
                      tickLine={false}
                      tickFormatter={(val) => `₹${val >= 1000 ? `${(val / 1000).toFixed(0)}k` : val}`}
                    />
                    <Tooltip
                      formatter={(val: number) => [formatCurrency(val), "Amount"]}
                      contentStyle={{
                        backgroundColor: "var(--card)",
                        borderColor: "var(--border)",
                        borderRadius: "8px",
                      }}
                    />
                    <Bar dataKey="amount" radius={[6, 6, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Right 1 Col: Account Distribution */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-4">
            <div>
              <CardTitle className="text-base font-bold">Account Balances</CardTitle>
              <CardDescription>Distribution across wallets & banks</CardDescription>
            </div>
            <Link
              href="/accounts"
              className="text-xs font-medium text-emerald-600 hover:underline flex items-center gap-1"
            >
              Manage <ChevronRight className="h-3.5 w-3.5" />
            </Link>
          </CardHeader>
          <CardContent>
            {loading ? (
              <Skeleton className="h-64 w-full" />
            ) : accounts.length === 0 ? (
              <div className="h-64 flex flex-col items-center justify-center text-center p-6 border border-dashed rounded-xl border-border">
                <Wallet className="h-8 w-8 text-muted-foreground mb-2" />
                <p className="font-semibold text-sm">No accounts found</p>
                <p className="text-xs text-muted-foreground mt-1">
                  Create your first bank or cash account to track balances.
                </p>
                <Link href="/accounts" className="mt-4">
                  <Button size="sm">Create Account</Button>
                </Link>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="h-40 w-full flex items-center justify-center">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={accountPieData}
                        dataKey="value"
                        nameKey="name"
                        cx="50%"
                        cy="50%"
                        innerRadius={45}
                        outerRadius={65}
                        paddingAngle={4}
                      >
                        {accountPieData.map((_: any, index: number) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip
                        formatter={(val: number) => [formatCurrency(val), "Balance"]}
                        contentStyle={{
                          backgroundColor: "var(--card)",
                          borderColor: "var(--border)",
                          borderRadius: "8px",
                        }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>

                <div className="space-y-2 max-h-32 overflow-y-auto pr-1">
                  {accounts.map((acc: any, i: number) => (
                    <div key={acc.id} className="flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2">
                        <span
                          className="w-2.5 h-2.5 rounded-full"
                          style={{ backgroundColor: COLORS[i % COLORS.length] }}
                        />
                        <span className="font-medium text-foreground truncate max-w-[120px]">
                          {acc.name}
                        </span>
                      </div>
                      <span className="font-bold text-foreground">
                        {formatCurrency(acc.current_balance, acc.currency)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Second Row: Recent Transactions + Budget & Goals */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Transactions List (2 Cols) */}
        <Card className="lg:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between pb-4">
            <div>
              <CardTitle className="text-base font-bold">Recent Transactions</CardTitle>
              <CardDescription>Latest 10 activities recorded in your account</CardDescription>
            </div>
            <Link
              href="/transactions"
              className="text-xs font-medium text-emerald-600 hover:underline flex items-center gap-1"
            >
              View all <ChevronRight className="h-3.5 w-3.5" />
            </Link>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="space-y-3">
                {[1, 2, 3, 4, 5].map((n) => (
                  <Skeleton key={n} className="h-12 w-full" />
                ))}
              </div>
            ) : recentTransactions.length === 0 ? (
              <div className="p-8 text-center border border-dashed rounded-xl border-border">
                <p className="text-sm font-semibold text-foreground">No transactions recorded yet</p>
                <p className="text-xs text-muted-foreground mt-1">
                  Add your first income or expense to populate your financial feed.
                </p>
                <Button size="sm" onClick={() => setQuickAddOpen(true)} className="mt-4">
                  <Plus className="h-4 w-4 mr-1.5" /> Add Transaction
                </Button>
              </div>
            ) : (
              <div className="divide-y divide-border">
                {recentTransactions.map((tx: any) => {
                  const isExpense = tx.type === "expense";
                  const isIncome = tx.type === "income";
                  return (
                    <div
                      key={tx.id}
                      className="py-3 flex items-center justify-between gap-3 text-xs hover:bg-muted/30 px-2 rounded-lg transition-colors"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div
                          className={`p-2 rounded-lg ${
                            isExpense
                              ? "bg-red-500/10 text-red-600"
                              : isIncome
                              ? "bg-emerald-500/10 text-emerald-600"
                              : "bg-blue-500/10 text-blue-600"
                          }`}
                        >
                          {isExpense ? (
                            <ArrowDownRight className="h-4 w-4" />
                          ) : isIncome ? (
                            <ArrowUpRight className="h-4 w-4" />
                          ) : (
                            <ArrowLeftRight className="h-4 w-4" />
                          )}
                        </div>
                        <div className="min-w-0">
                          <p className="font-semibold text-foreground text-sm truncate">{tx.title}</p>
                          <div className="flex items-center gap-2 text-muted-foreground text-[11px] mt-0.5">
                            <span>{formatDate(tx.date)}</span>
                            <span>•</span>
                            <span>{tx.category?.name || "General"}</span>
                            <span>•</span>
                            <span>{tx.account?.name || "N/A"}</span>
                          </div>
                        </div>
                      </div>

                      <div className="text-right whitespace-nowrap">
                        <p
                          className={`font-bold text-sm ${
                            isExpense
                              ? "text-red-600 dark:text-red-400"
                              : isIncome
                              ? "text-emerald-600 dark:text-emerald-400"
                              : "text-blue-600 dark:text-blue-400"
                          }`}
                        >
                          {isExpense ? "-" : isIncome ? "+" : ""}
                          {formatCurrency(tx.amount)}
                        </p>
                        <span className="text-[10px] text-muted-foreground uppercase">{tx.type}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Budgets & Goals Overview (1 Col) */}
        <div className="space-y-6">
          {/* Budget Utilization */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-3">
              <div>
                <CardTitle className="text-base font-bold">Monthly Budgets</CardTitle>
                <CardDescription>Track category limits</CardDescription>
              </div>
              <Link
                href="/budgets"
                className="text-xs font-medium text-emerald-600 hover:underline flex items-center gap-1"
              >
                All Budgets <ChevronRight className="h-3.5 w-3.5" />
              </Link>
            </CardHeader>
            <CardContent>
              {loading ? (
                <Skeleton className="h-28 w-full" />
              ) : budgets.length === 0 ? (
                <div className="p-4 text-center border border-dashed rounded-lg border-border text-xs text-muted-foreground">
                  No budgets configured for this month.
                  <div className="mt-2">
                    <Link href="/budgets">
                      <Button size="sm" variant="outline">Set Monthly Budget</Button>
                    </Link>
                  </div>
                </div>
              ) : (
                <div className="space-y-3.5">
                  {budgets.slice(0, 3).map((b: any) => (
                    <div key={b.id} className="space-y-1 text-xs">
                      <div className="flex items-center justify-between">
                        <span className="font-semibold text-foreground">{b.category?.name}</span>
                        <span className="text-muted-foreground">
                          {formatCurrency(b.spent)} / {formatCurrency(b.amount)}
                        </span>
                      </div>
                      <div className="w-full bg-muted rounded-full h-2 overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all ${
                            b.percentage >= 100
                              ? "bg-red-500"
                              : b.percentage >= 80
                              ? "bg-amber-500"
                              : "bg-emerald-500"
                          }`}
                          style={{ width: `${Math.min(100, b.percentage)}%` }}
                        />
                      </div>
                      <div className="flex justify-between text-[10px] text-muted-foreground pt-0.5">
                        <span>{b.percentage}% consumed</span>
                        <span
                          className={
                            b.status === "exceeded"
                              ? "text-red-500 font-bold"
                              : b.status === "warning"
                              ? "text-amber-500 font-bold"
                              : "text-emerald-500"
                          }
                        >
                          {b.status.toUpperCase()}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Upcoming Payments / Reminders */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-3">
              <div>
                <CardTitle className="text-base font-bold">Upcoming Dues</CardTitle>
                <CardDescription>Recurring bills & reminders</CardDescription>
              </div>
              <Link
                href="/recurring"
                className="text-xs font-medium text-emerald-600 hover:underline flex items-center gap-1"
              >
                Schedule <ChevronRight className="h-3.5 w-3.5" />
              </Link>
            </CardHeader>
            <CardContent>
              {upcomingReminders.length === 0 && upcomingRecurring.length === 0 ? (
                <div className="p-4 text-center border border-dashed rounded-lg border-border text-xs text-muted-foreground">
                  No upcoming dues or reminders right now.
                </div>
              ) : (
                <div className="space-y-2.5">
                  {upcomingRecurring.slice(0, 2).map((rec: any) => (
                    <div
                      key={rec.id}
                      className="p-2.5 rounded-lg border border-border bg-muted/20 flex items-center justify-between text-xs"
                    >
                      <div className="flex items-center gap-2">
                        <Clock className="h-3.5 w-3.5 text-emerald-600" />
                        <div>
                          <p className="font-semibold text-foreground">{rec.title}</p>
                          <p className="text-[10px] text-muted-foreground">Due: {rec.next_occurrence}</p>
                        </div>
                      </div>
                      <span className="font-bold text-foreground">{formatCurrency(rec.amount)}</span>
                    </div>
                  ))}
                  {upcomingReminders.slice(0, 2).map((rem: any) => (
                    <div
                      key={rem.id}
                      className="p-2.5 rounded-lg border border-border bg-muted/20 flex items-center justify-between text-xs"
                    >
                      <div className="flex items-center gap-2">
                        <AlertTriangle className="h-3.5 w-3.5 text-amber-500" />
                        <div>
                          <p className="font-semibold text-foreground">{rem.title}</p>
                          <p className="text-[10px] text-muted-foreground">Due: {rem.due_date}</p>
                        </div>
                      </div>
                      {rem.amount ? (
                        <span className="font-bold text-foreground">{formatCurrency(rem.amount)}</span>
                      ) : (
                        <Badge variant="outline">Reminder</Badge>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Quick Add Modal */}
      <QuickAddModal
        open={quickAddOpen}
        onOpenChange={setQuickAddOpen}
        onSuccess={() => loadData()}
      />
    </div>
  );
}
