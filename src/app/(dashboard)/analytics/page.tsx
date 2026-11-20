"use client";

import * as React from "react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/ui/card";
import { Select } from "@/ui/select";
import { Skeleton } from "@/ui/skeleton";
import { Badge } from "@/ui/badge";
import { formatCurrency } from "@/lib/utils";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  AreaChart,
  Area,
} from "recharts";
import {
  TrendingUp,
  TrendingDown,
  PiggyBank,
  PieChart as PieIcon,
  Flame,
  Calendar,
  AlertCircle,
} from "lucide-react";

export default function AnalyticsPage() {
  const [months, setMonths] = React.useState("6");
  const [loading, setLoading] = React.useState(true);
  const [analyticsData, setAnalyticsData] = React.useState<any>(null);

  const loadAnalytics = React.useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/dashboard/analytics?months=${months}`);
      const json = await res.json();
      if (json.success && json.data) {
        setAnalyticsData(json.data);
      }
    } catch {
    } finally {
      setLoading(false);
    }
  }, [months]);

  React.useEffect(() => {
    loadAnalytics();
  }, [loadAnalytics]);

  const monthlyTrends = analyticsData?.monthlyTrends || [];
  const categoryDistribution = analyticsData?.categoryDistribution || [];
  const incomeSources = analyticsData?.incomeSources || [];
  const dailyTrendList = analyticsData?.dailyTrendList || [];
  const stats = analyticsData?.stats || {
    totalIncome: 0,
    totalExpenses: 0,
    netSavings: 0,
    savingsRate: 0,
    averageMonthlyExpense: 0,
    averageMonthlyIncome: 0,
    highestExpense: { title: "None", amount: 0, date: "" },
    highestSpendingCategory: { name: "None", amount: 0 },
  };

  const COLORS = [
    "#10b981", "#3b82f6", "#ef4444", "#f59e0b", "#8b5cf6",
    "#ec4899", "#06b6d4", "#84cc16", "#64748b", "#f97316"
  ];

  return (
    <div className="space-y-6">
      {/* Header & Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground">
            Financial Analytics
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Deep insights into your cash flow trends, category distribution, and savings efficiency.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Select
            value={months}
            onChange={(e) => setMonths(e.target.value)}
            className="w-36 text-xs h-9"
          >
            <option value="3">Last 3 Months</option>
            <option value="6">Last 6 Months</option>
            <option value="12">Last 12 Months</option>
          </Select>
        </div>
      </div>

      {/* Analytics KPI Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Avg. Monthly Spending
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <Skeleton className="h-8 w-28" />
            ) : (
              <div className="text-2xl font-black text-foreground">
                {formatCurrency(stats.averageMonthlyExpense)}
              </div>
            )}
            <p className="text-[11px] text-muted-foreground mt-1">Over past {months} months</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Overall Savings Rate
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <Skeleton className="h-8 w-28" />
            ) : (
              <div className="text-2xl font-black text-emerald-600 dark:text-emerald-400">
                {stats.savingsRate}%
              </div>
            )}
            <p className="text-[11px] text-muted-foreground mt-1">Net Savings: {formatCurrency(stats.netSavings)}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Highest Single Expense
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <Skeleton className="h-8 w-28" />
            ) : (
              <div className="text-2xl font-black text-red-600 dark:text-red-400">
                {formatCurrency(stats.highestExpense?.amount || 0)}
              </div>
            )}
            <p className="text-[11px] text-muted-foreground mt-1 truncate">
              {stats.highestExpense?.title || "None"}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Top Category
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <Skeleton className="h-8 w-28" />
            ) : (
              <div className="text-2xl font-black text-foreground">
                {stats.highestSpendingCategory?.name || "None"}
              </div>
            )}
            <p className="text-[11px] text-muted-foreground mt-1">
              {formatCurrency(stats.highestSpendingCategory?.amount || 0)} spent
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Main Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Chart 1: Monthly Income vs Expenses Trend */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base font-bold">Monthly Income vs Expenses</CardTitle>
            <CardDescription>Multi-month comparison of earnings and outgoings</CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <Skeleton className="h-72 w-full" />
            ) : monthlyTrends.length === 0 ? (
              <div className="h-72 flex items-center justify-center text-xs text-muted-foreground border border-dashed rounded-xl">
                No monthly data available for this range.
              </div>
            ) : (
              <div className="h-72 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={monthlyTrends} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" opacity={0.15} />
                    <XAxis dataKey="month" stroke="#888888" fontSize={11} tickLine={false} />
                    <YAxis
                      stroke="#888888"
                      fontSize={11}
                      tickLine={false}
                      tickFormatter={(val) => `₹${val >= 1000 ? `${(val / 1000).toFixed(0)}k` : val}`}
                    />
                    <Tooltip
                      formatter={(val: number) => [formatCurrency(val), ""]}
                      contentStyle={{
                        backgroundColor: "var(--card)",
                        borderColor: "var(--border)",
                        borderRadius: "8px",
                      }}
                    />
                    <Bar dataKey="income" name="Income" fill="#10b981" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="expense" name="Expenses" fill="#ef4444" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Chart 2: Net Monthly Savings Trend */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base font-bold">Net Monthly Savings Curve</CardTitle>
            <CardDescription>Track accumulation and net cash surplus per month</CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <Skeleton className="h-72 w-full" />
            ) : monthlyTrends.length === 0 ? (
              <div className="h-72 flex items-center justify-center text-xs text-muted-foreground border border-dashed rounded-xl">
                No savings data available for this range.
              </div>
            ) : (
              <div className="h-72 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={monthlyTrends} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                    <defs>
                      <linearGradient id="colorSavings" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#10b981" stopOpacity={0.4} />
                        <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" opacity={0.15} />
                    <XAxis dataKey="month" stroke="#888888" fontSize={11} tickLine={false} />
                    <YAxis
                      stroke="#888888"
                      fontSize={11}
                      tickLine={false}
                      tickFormatter={(val) => `₹${val >= 1000 ? `${(val / 1000).toFixed(0)}k` : val}`}
                    />
                    <Tooltip
                      formatter={(val: number) => [formatCurrency(val), "Net Savings"]}
                      contentStyle={{
                        backgroundColor: "var(--card)",
                        borderColor: "var(--border)",
                        borderRadius: "8px",
                      }}
                    />
                    <Area
                      type="monotone"
                      dataKey="savings"
                      stroke="#10b981"
                      strokeWidth={2}
                      fillOpacity={1}
                      fill="url(#colorSavings)"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Chart 3: Category Expense Breakdown */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base font-bold">Expense Breakdown by Category</CardTitle>
            <CardDescription>Where your money went in the selected period</CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <Skeleton className="h-72 w-full" />
            ) : categoryDistribution.length === 0 ? (
              <div className="h-72 flex items-center justify-center text-xs text-muted-foreground border border-dashed rounded-xl">
                No categorized expenses found.
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-center">
                <div className="h-56 w-full flex items-center justify-center">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={categoryDistribution}
                        dataKey="amount"
                        nameKey="category"
                        cx="50%"
                        cy="50%"
                        innerRadius={50}
                        outerRadius={75}
                        paddingAngle={3}
                      >
                        {categoryDistribution.map((entry: any, index: number) => (
                          <Cell
                            key={`cell-${index}`}
                            fill={entry.color || COLORS[index % COLORS.length]}
                          />
                        ))}
                      </Pie>
                      <Tooltip
                        formatter={(val: number) => [formatCurrency(val), "Spent"]}
                        contentStyle={{
                          backgroundColor: "var(--card)",
                          borderColor: "var(--border)",
                          borderRadius: "8px",
                        }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>

                <div className="space-y-2 max-h-56 overflow-y-auto pr-2">
                  {categoryDistribution.map((cat: any, i: number) => (
                    <div key={cat.category} className="flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2">
                        <span
                          className="w-2.5 h-2.5 rounded-full"
                          style={{ backgroundColor: cat.color || COLORS[i % COLORS.length] }}
                        />
                        <span className="font-medium text-foreground truncate max-w-[110px]">
                          {cat.category}
                        </span>
                      </div>
                      <div className="text-right">
                        <span className="font-bold">{formatCurrency(cat.amount)}</span>
                        <span className="text-[10px] text-muted-foreground ml-1.5">
                          ({cat.percentage}%)
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Chart 4: Income Sources Breakdown */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base font-bold">Income Streams Distribution</CardTitle>
            <CardDescription>Salary, freelance, investments, and business revenue</CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <Skeleton className="h-72 w-full" />
            ) : incomeSources.length === 0 ? (
              <div className="h-72 flex items-center justify-center text-xs text-muted-foreground border border-dashed rounded-xl">
                No recorded income transactions in this period.
              </div>
            ) : (
              <div className="space-y-3 pt-2">
                {incomeSources.map((inc: any, i: number) => (
                  <div key={inc.category} className="space-y-1.5 text-xs">
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-foreground">{inc.category}</span>
                      <span className="font-extrabold text-emerald-600 dark:text-emerald-400">
                        {formatCurrency(inc.amount)} ({inc.percentage}%)
                      </span>
                    </div>
                    <div className="w-full bg-muted rounded-full h-2 overflow-hidden">
                      <div
                        className="h-full bg-emerald-500 rounded-full"
                        style={{ width: `${inc.percentage}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
