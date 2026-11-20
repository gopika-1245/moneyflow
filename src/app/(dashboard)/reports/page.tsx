"use client";

import * as React from "react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/ui/card";
import { Button } from "@/ui/button";
import { Input } from "@/ui/input";
import { Select } from "@/ui/select";
import { Badge } from "@/ui/badge";
import { Skeleton } from "@/ui/skeleton";
import { formatCurrency, formatDate } from "@/lib/utils";
import {
  FileSpreadsheet,
  Download,
  FileText,
  Filter,
  TrendingUp,
  TrendingDown,
  PiggyBank,
  CheckCircle,
} from "lucide-react";
import { toast } from "sonner";
import { startOfMonth, endOfMonth, subMonths, format } from "date-fns";

export default function ReportsPage() {
  const now = new Date();
  const [startDate, setStartDate] = React.useState(format(startOfMonth(now), "yyyy-MM-dd"));
  const [endDate, setEndDate] = React.useState(format(endOfMonth(now), "yyyy-MM-dd"));
  const [type, setType] = React.useState("");

  const [loading, setLoading] = React.useState(true);
  const [reportData, setReportData] = React.useState<any>(null);

  const loadReport = React.useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (startDate) params.set("startDate", startDate);
      if (endDate) params.set("endDate", endDate);
      if (type) params.set("type", type);

      const res = await fetch(`/api/reports/transactions?${params.toString()}`);
      const json = await res.json();
      if (json.success && json.data) {
        setReportData(json.data);
      }
    } catch {
      toast.error("Failed to generate report");
    } finally {
      setLoading(false);
    }
  }, [startDate, endDate, type]);

  React.useEffect(() => {
    loadReport();
  }, [loadReport]);

  const summary = reportData?.summary || {
    totalIncome: 0,
    totalExpenses: 0,
    netSavings: 0,
    savingsRate: 0,
    transactionCount: 0,
  };
  const categoryBreakdown = reportData?.categoryBreakdown || [];
  const transactions = reportData?.transactions || [];

  const csvExportUrl = `/api/reports/export/csv?startDate=${startDate}&endDate=${endDate}${
    type ? `&type=${type}` : ""
  }`;
  const pdfExportUrl = `/api/reports/export/pdf?startDate=${startDate}&endDate=${endDate}${
    type ? `&type=${type}` : ""
  }`;

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground">
            Reports & Statements
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Generate audit-ready financial statements, tax summaries, and downloadable CSV/PDF exports.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <a
            href={csvExportUrl}
            download
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg border border-border bg-card text-xs font-semibold text-foreground hover:bg-muted transition-colors shadow-sm"
          >
            <Download className="h-4 w-4 text-emerald-600" /> Export CSV
          </a>
          <a
            href={pdfExportUrl}
            download
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-emerald-600 text-white text-xs font-semibold hover:bg-emerald-700 transition-colors shadow-sm"
          >
            <FileText className="h-4 w-4" /> Download PDF Report
          </a>
        </div>
      </div>

      {/* Date Range & Filter Card */}
      <Card>
        <CardContent className="p-4">
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 items-end">
            <div className="space-y-1">
              <label className="text-xs font-medium text-muted-foreground">Start Date</label>
              <Input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-medium text-muted-foreground">End Date</label>
              <Input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-medium text-muted-foreground">Transaction Type</label>
              <Select value={type} onChange={(e) => setType(e.target.value)}>
                <option value="">All Transactions</option>
                <option value="expense">Expenses Only</option>
                <option value="income">Income Only</option>
                <option value="transfer">Transfers Only</option>
              </Select>
            </div>

            <Button onClick={loadReport} variant="outline" className="text-xs font-semibold">
              <Filter className="h-3.5 w-3.5 mr-1.5" /> Apply Filter
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Total Earnings
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <Skeleton className="h-8 w-28" />
            ) : (
              <div className="text-2xl font-black text-emerald-600 dark:text-emerald-400">
                {formatCurrency(summary.totalIncome)}
              </div>
            )}
            <p className="text-[11px] text-muted-foreground mt-1">In selected range</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Total Outgoings
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <Skeleton className="h-8 w-28" />
            ) : (
              <div className="text-2xl font-black text-red-600 dark:text-red-400">
                {formatCurrency(summary.totalExpenses)}
              </div>
            )}
            <p className="text-[11px] text-muted-foreground mt-1">Qualifying expense transactions</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Net Savings
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <Skeleton className="h-8 w-28" />
            ) : (
              <div className="text-2xl font-black text-foreground">
                {formatCurrency(summary.netSavings)}
              </div>
            )}
            <p className="text-[11px] text-muted-foreground mt-1">{summary.savingsRate}% Savings Rate</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Recorded Entries
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <Skeleton className="h-8 w-28" />
            ) : (
              <div className="text-2xl font-black text-foreground">
                {summary.transactionCount}
              </div>
            )}
            <p className="text-[11px] text-muted-foreground mt-1">Transactions audited</p>
          </CardContent>
        </Card>
      </div>

      {/* Category Breakdown & Transaction Ledger Table */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Category Breakdown (1 Col) */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base font-bold">Category Distribution</CardTitle>
            <CardDescription>Sum of expenses by category</CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <Skeleton className="h-48 w-full" />
            ) : categoryBreakdown.length === 0 ? (
              <div className="p-8 text-center text-xs text-muted-foreground">
                No expense categories recorded in this period.
              </div>
            ) : (
              <div className="space-y-3">
                {categoryBreakdown.map((cat: any) => (
                  <div key={cat.category} className="space-y-1 text-xs">
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-foreground">{cat.category}</span>
                      <span className="font-bold text-foreground">
                        {formatCurrency(cat.amount)} ({cat.percentage}%)
                      </span>
                    </div>
                    <div className="w-full bg-muted rounded-full h-2 overflow-hidden">
                      <div
                        className="h-full bg-emerald-500 rounded-full"
                        style={{ width: `${cat.percentage}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Transactions Table (2 Cols) */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-base font-bold">Statement Ledger</CardTitle>
            <CardDescription>All line items included in the report export</CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto max-h-96 overflow-y-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-border bg-muted/40 font-semibold text-muted-foreground text-[11px] sticky top-0 bg-card z-10">
                    <th className="py-2.5 px-4">Date</th>
                    <th className="py-2.5 px-4">Title</th>
                    <th className="py-2.5 px-4">Category</th>
                    <th className="py-2.5 px-4">Account</th>
                    <th className="py-2.5 px-4 text-right">Amount</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {transactions.map((t: any) => (
                    <tr key={t.id} className="hover:bg-muted/20">
                      <td className="py-2.5 px-4 whitespace-nowrap">{formatDate(t.date)}</td>
                      <td className="py-2.5 px-4 font-semibold text-foreground truncate max-w-xs">
                        {t.title}
                      </td>
                      <td className="py-2.5 px-4">{t.category?.name || "General"}</td>
                      <td className="py-2.5 px-4">{t.account?.name || "N/A"}</td>
                      <td
                        className={`py-2.5 px-4 text-right font-bold ${
                          t.type === "expense"
                            ? "text-red-600 dark:text-red-400"
                            : t.type === "income"
                            ? "text-emerald-600 dark:text-emerald-400"
                            : "text-blue-600"
                        }`}
                      >
                        {formatCurrency(t.amount)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
