"use client";

import * as React from "react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/ui/card";
import { Button } from "@/ui/button";
import { Input } from "@/ui/input";
import { Select } from "@/ui/select";
import { Badge } from "@/ui/badge";
import { Skeleton } from "@/ui/skeleton";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/ui/dialog";
import { formatCurrency } from "@/lib/utils";
import {
  PiggyBank,
  Plus,
  Trash2,
  Edit,
  AlertTriangle,
  CheckCircle2,
  Calendar,
  Sparkles,
} from "lucide-react";
import { toast } from "sonner";
import { BudgetItem, CategoryItem } from "@/types/finance";

export default function BudgetsPage() {
  const now = new Date();
  const [month, setMonth] = React.useState(now.getMonth() + 1);
  const [year, setYear] = React.useState(now.getFullYear());

  const [budgets, setBudgets] = React.useState<BudgetItem[]>([]);
  const [overview, setOverview] = React.useState<any>(null);
  const [loading, setLoading] = React.useState(true);

  const [categories, setCategories] = React.useState<CategoryItem[]>([]);
  const [createOpen, setCreateOpen] = React.useState(false);
  const [categoryId, setCategoryId] = React.useState("");
  const [amount, setAmount] = React.useState("");
  const [formLoading, setFormLoading] = React.useState(false);

  // Load Categories
  React.useEffect(() => {
    fetch("/api/categories?type=expense")
      .then((r) => r.json())
      .then((j) => {
        if (j.success && j.data) {
          setCategories(j.data);
          if (j.data.length > 0) setCategoryId(j.data[0].id);
        }
      })
      .catch(() => {});
  }, []);

  const loadBudgets = React.useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/budgets?month=${month}&year=${year}`);
      const json = await res.json();
      if (json.success && json.data) {
        setBudgets(json.data.budgets || []);
        setOverview(json.data.overview || null);
      }
    } catch {
      toast.error("Failed to load budgets");
    } finally {
      setLoading(false);
    }
  }, [month, year]);

  React.useEffect(() => {
    loadBudgets();
  }, [loadBudgets]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!categoryId) {
      toast.error("Please select a category");
      return;
    }
    const numAmt = parseFloat(amount);
    if (isNaN(numAmt) || numAmt <= 0) {
      toast.error("Please enter a valid budget amount");
      return;
    }

    setFormLoading(true);
    try {
      const res = await fetch("/api/budgets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          categoryId,
          amount: numAmt,
          month,
          year,
        }),
      });

      const json = await res.json();
      if (!res.ok || !json.success) throw new Error(json.error || "Failed to save budget");

      toast.success("Budget saved successfully!");
      setCreateOpen(false);
      setAmount("");
      loadBudgets();
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Error saving budget");
    } finally {
      setFormLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to remove this budget limit?")) return;
    try {
      const res = await fetch(`/api/budgets/${id}`, { method: "DELETE" });
      const json = await res.json();
      if (!res.ok || !json.success) throw new Error(json.error || "Failed");

      toast.success("Budget deleted");
      loadBudgets();
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Error deleting budget");
    }
  };

  const monthNames = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December",
  ];

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground">
            Monthly Budgets
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Set category limits, track spending progress, and prevent overspending.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* Month / Year Filter */}
          <div className="flex items-center gap-1.5 p-1 bg-card border border-border rounded-xl shadow-sm text-xs">
            <Select
              value={String(month)}
              onChange={(e) => setMonth(parseInt(e.target.value, 10))}
              className="h-8 py-0"
            >
              {monthNames.map((m, i) => (
                <option key={m} value={String(i + 1)}>
                  {m}
                </option>
              ))}
            </Select>

            <Select
              value={String(year)}
              onChange={(e) => setYear(parseInt(e.target.value, 10))}
              className="h-8 py-0"
            >
              {[2024, 2025, 2026, 2027].map((y) => (
                <option key={y} value={String(y)}>
                  {y}
                </option>
              ))}
            </Select>
          </div>

          <Button onClick={() => setCreateOpen(true)} className="text-xs sm:text-sm font-semibold">
            <Plus className="h-4 w-4 mr-1.5" /> Set Budget
          </Button>
        </div>
      </div>

      {/* Overview KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Total Budgeted
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <Skeleton className="h-8 w-28" />
            ) : (
              <div className="text-2xl font-black text-foreground">
                {formatCurrency(overview?.totalBudget || 0)}
              </div>
            )}
            <p className="text-[11px] text-muted-foreground mt-1">Planned cap for {monthNames[month - 1]}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Total Spent
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <Skeleton className="h-8 w-28" />
            ) : (
              <div className="text-2xl font-black text-red-600 dark:text-red-400">
                {formatCurrency(overview?.totalSpent || 0)}
              </div>
            )}
            <p className="text-[11px] text-muted-foreground mt-1">
              {overview?.overallPercentage || 0}% of overall budget consumed
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Remaining Budget
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <Skeleton className="h-8 w-28" />
            ) : (
              <div className="text-2xl font-black text-emerald-600 dark:text-emerald-400">
                {formatCurrency(overview?.totalRemaining || 0)}
              </div>
            )}
            <div className="mt-1">
              <Badge
                variant={
                  overview?.status === "exceeded"
                    ? "destructive"
                    : overview?.status === "warning"
                    ? "warning"
                    : "success"
                }
              >
                {overview?.status?.toUpperCase() || "HEALTHY"}
              </Badge>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Category Budgets Grid */}
      <div>
        <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">
          Category Limits ({budgets.length})
        </h2>

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[1, 2, 3].map((n) => (
              <Skeleton key={n} className="h-44 w-full rounded-xl" />
            ))}
          </div>
        ) : budgets.length === 0 ? (
          <Card className="p-12 text-center border-dashed border-border">
            <PiggyBank className="h-10 w-10 text-muted-foreground mx-auto mb-2" />
            <p className="font-bold text-base">No budgets configured for this month</p>
            <p className="text-xs text-muted-foreground mt-1 max-w-sm mx-auto">
              Setting limits on categories like Food, Utilities, and Shopping helps keep your expenses under control.
            </p>
            <Button size="sm" onClick={() => setCreateOpen(true)} className="mt-4">
              <Plus className="h-4 w-4 mr-1.5" /> Set Category Budget
            </Button>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {budgets.map((b) => {
              const isExceeded = b.status === "exceeded";
              const isWarning = b.status === "warning";

              return (
                <Card
                  key={b.id}
                  className={`transition-all ${
                    isExceeded
                      ? "border-red-500/50 bg-red-500/5"
                      : isWarning
                      ? "border-amber-500/50 bg-amber-500/5"
                      : "hover:border-emerald-500/40"
                  }`}
                >
                  <CardHeader className="flex flex-row items-start justify-between pb-2 space-y-0">
                    <div>
                      <CardTitle className="text-base font-bold text-foreground">
                        {b.category?.name}
                      </CardTitle>
                      <p className="text-xs text-muted-foreground">
                        Limit: {formatCurrency(b.amount)}
                      </p>
                    </div>

                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => handleDelete(b.id)}
                        className="p-1.5 rounded-md text-muted-foreground hover:text-red-600 hover:bg-muted"
                        title="Delete budget"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </CardHeader>

                  <CardContent className="space-y-3 pt-2">
                    <div className="flex items-baseline justify-between text-xs">
                      <span className="text-muted-foreground">Spent</span>
                      <span className="font-extrabold text-sm text-foreground">
                        {formatCurrency(b.spent)}
                      </span>
                    </div>

                    {/* Progress Bar */}
                    <div className="w-full bg-muted rounded-full h-2.5 overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-300 ${
                          isExceeded
                            ? "bg-red-500"
                            : isWarning
                            ? "bg-amber-500"
                            : "bg-emerald-500"
                        }`}
                        style={{ width: `${Math.min(100, b.percentage)}%` }}
                      />
                    </div>

                    <div className="flex items-center justify-between text-[11px] pt-1">
                      <span className="font-medium text-muted-foreground">
                        {b.percentage}% utilized
                      </span>
                      <span
                        className={
                          isExceeded
                            ? "text-red-600 dark:text-red-400 font-bold"
                            : isWarning
                            ? "text-amber-600 dark:text-amber-400 font-bold"
                            : "text-emerald-600 dark:text-emerald-400 font-medium"
                        }
                      >
                        {isExceeded
                          ? `Exceeded by ${formatCurrency(b.spent - b.amount)}`
                          : `${formatCurrency(b.remaining)} left`}
                      </span>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>

      {/* Set Budget Modal */}
      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent onClose={() => setCreateOpen(false)}>
          <DialogHeader>
            <DialogTitle>Set Category Budget</DialogTitle>
            <DialogDescription>
              Define maximum planned spending for {monthNames[month - 1]} {year}.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleCreate} className="space-y-4">
            <div className="space-y-1">
              <label className="text-xs font-medium text-muted-foreground">Category</label>
              <Select value={categoryId} onChange={(e) => setCategoryId(e.target.value)} required>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </Select>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-medium text-muted-foreground">Monthly Limit (₹)</label>
              <Input
                type="number"
                step="0.01"
                min="0.01"
                placeholder="e.g. 15000"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                required
              />
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setCreateOpen(false)}
                disabled={formLoading}
              >
                Cancel
              </Button>
              <Button type="submit" isLoading={formLoading}>
                Set Budget
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
