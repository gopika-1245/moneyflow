"use client";

import * as React from "react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/ui/card";
import { Button } from "@/ui/button";
import { Input } from "@/ui/input";
import { Select } from "@/ui/select";
import { Badge } from "@/ui/badge";
import { Skeleton } from "@/ui/skeleton";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/ui/dialog";
import { formatCurrency, formatDate } from "@/lib/utils";
import {
  Repeat,
  Plus,
  Trash2,
  Play,
  Pause,
  ArrowUpRight,
  ArrowDownRight,
  Calendar,
  Zap,
} from "lucide-react";
import { toast } from "sonner";
import { RecurringTransactionItem, AccountItem, CategoryItem } from "@/types/finance";

export default function RecurringPage() {
  const [recurringList, setRecurringList] = React.useState<RecurringTransactionItem[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [createOpen, setCreateOpen] = React.useState(false);
  const [runningCron, setRunningCron] = React.useState(false);

  // Form state
  const [title, setTitle] = React.useState("");
  const [amount, setAmount] = React.useState("");
  const [type, setType] = React.useState<"expense" | "income">("expense");
  const [frequency, setFrequency] = React.useState<"daily" | "weekly" | "monthly" | "quarterly" | "yearly">("monthly");
  const [accountId, setAccountId] = React.useState("");
  const [categoryId, setCategoryId] = React.useState("");
  const [startDate, setStartDate] = React.useState(new Date().toISOString().split("T")[0]);
  const [endDate, setEndDate] = React.useState("");
  const [notes, setNotes] = React.useState("");
  const [formLoading, setFormLoading] = React.useState(false);

  const [accounts, setAccounts] = React.useState<AccountItem[]>([]);
  const [categories, setCategories] = React.useState<CategoryItem[]>([]);

  React.useEffect(() => {
    fetch("/api/accounts")
      .then((r) => r.json())
      .then((j) => {
        if (j.success && j.data) {
          setAccounts(j.data);
          if (j.data.length > 0) setAccountId(j.data[0].id);
        }
      })
      .catch(() => {});

    fetch("/api/categories")
      .then((r) => r.json())
      .then((j) => {
        if (j.success && j.data) {
          setCategories(j.data);
        }
      })
      .catch(() => {});
  }, []);

  const loadRecurring = React.useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/recurring");
      const json = await res.json();
      if (json.success && json.data) {
        setRecurringList(json.data);
      }
    } catch {
      toast.error("Failed to load recurring transactions");
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    loadRecurring();
  }, [loadRecurring]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    const numAmt = parseFloat(amount);
    if (isNaN(numAmt) || numAmt <= 0) {
      toast.error("Please enter a valid amount");
      return;
    }
    if (!accountId) {
      toast.error("Please select an account");
      return;
    }

    setFormLoading(true);
    try {
      const res = await fetch("/api/recurring", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          amount: numAmt,
          type,
          frequency,
          accountId,
          categoryId: categoryId || null,
          startDate,
          endDate: endDate || null,
          notes: notes || null,
          isActive: true,
        }),
      });

      const json = await res.json();
      if (!res.ok || !json.success) throw new Error(json.error || "Failed to schedule recurring transaction");

      toast.success("Recurring schedule created!");
      setCreateOpen(false);
      setTitle("");
      setAmount("");
      setNotes("");
      loadRecurring();
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Error saving schedule");
    } finally {
      setFormLoading(false);
    }
  };

  const handleToggleActive = async (item: RecurringTransactionItem) => {
    try {
      const res = await fetch(`/api/recurring/${item.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive: !item.is_active }),
      });
      const json = await res.json();
      if (!res.ok || !json.success) throw new Error(json.error || "Failed");

      toast.success(item.is_active ? "Schedule paused" : "Schedule activated");
      loadRecurring();
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Error updating schedule");
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to cancel and delete this recurring schedule?")) return;
    try {
      const res = await fetch(`/api/recurring/${id}`, { method: "DELETE" });
      const json = await res.json();
      if (!res.ok || !json.success) throw new Error(json.error || "Failed");

      toast.success("Schedule deleted");
      loadRecurring();
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Error deleting schedule");
    }
  };

  const handleRunCronNow = async () => {
    setRunningCron(true);
    try {
      const res = await fetch("/api/cron/recurring", { method: "POST" });
      const json = await res.json();
      if (!res.ok || !json.success) throw new Error(json.error || "Cron run failed");

      toast.success(
        `Processor executed! ${json.data?.transactionsCreated || 0} transaction(s) generated.`
      );
      loadRecurring();
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Error executing cron");
    } finally {
      setRunningCron(false);
    }
  };

  const filteredCategories = categories.filter((c) => c.type === type);

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground">
            Recurring Transactions
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Automate recurring salaries, subscriptions, rent, and loan repayments via Vercel Cron.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            onClick={handleRunCronNow}
            isLoading={runningCron}
            className="text-xs sm:text-sm font-semibold"
            title="Trigger automated recurrence checks immediately"
          >
            <Zap className="h-4 w-4 mr-1.5 text-amber-500" /> Process Due Now
          </Button>
          <Button onClick={() => setCreateOpen(true)} className="text-xs sm:text-sm font-semibold">
            <Plus className="h-4 w-4 mr-1.5" /> Schedule New
          </Button>
        </div>
      </div>

      {/* Recurring Schedules List */}
      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-border bg-muted/40 font-semibold text-muted-foreground uppercase tracking-wider text-[11px]">
                  <th className="py-3 px-4">Title & Type</th>
                  <th className="py-3 px-4">Frequency</th>
                  <th className="py-3 px-4">Account</th>
                  <th className="py-3 px-4">Next Due Date</th>
                  <th className="py-3 px-4 text-right">Amount</th>
                  <th className="py-3 px-4 text-center">Status</th>
                  <th className="py-3 px-4 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {loading ? (
                  <tr>
                    <td colSpan={7} className="p-6 text-center">
                      <div className="space-y-2">
                        {[1, 2, 3].map((n) => (
                          <Skeleton key={n} className="h-10 w-full" />
                        ))}
                      </div>
                    </td>
                  </tr>
                ) : recurringList.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="p-12 text-center text-muted-foreground">
                      <Repeat className="h-8 w-8 mx-auto mb-2 opacity-50" />
                      <p className="font-semibold text-foreground text-sm">No recurring schedules found</p>
                      <p className="text-xs mt-1">
                        Add subscriptions like Netflix, Spotify, or regular income like Salary to automate logging.
                      </p>
                      <Button size="sm" onClick={() => setCreateOpen(true)} className="mt-4">
                        <Plus className="h-4 w-4 mr-1.5" /> Create Schedule
                      </Button>
                    </td>
                  </tr>
                ) : (
                  recurringList.map((rec) => {
                    const isExpense = rec.type === "expense";
                    return (
                      <tr key={rec.id} className="hover:bg-muted/30 transition-colors">
                        <td className="py-3.5 px-4 font-medium text-foreground">
                          <div className="flex items-center gap-2.5">
                            <span
                              className={`p-1.5 rounded-md ${
                                isExpense
                                  ? "bg-red-500/10 text-red-600"
                                  : "bg-emerald-500/10 text-emerald-600"
                              }`}
                            >
                              {isExpense ? (
                                <ArrowDownRight className="h-3.5 w-3.5" />
                              ) : (
                                <ArrowUpRight className="h-3.5 w-3.5" />
                              )}
                            </span>
                            <div>
                              <p className="font-semibold text-foreground text-sm truncate">{rec.title}</p>
                              <p className="text-[11px] text-muted-foreground">
                                {rec.category?.name || "General"}
                              </p>
                            </div>
                          </div>
                        </td>
                        <td className="py-3.5 px-4 whitespace-nowrap">
                          <Badge variant="outline" className="uppercase font-semibold text-[10px]">
                            {rec.frequency}
                          </Badge>
                        </td>
                        <td className="py-3.5 px-4 whitespace-nowrap font-medium text-foreground">
                          {rec.account?.name || "N/A"}
                        </td>
                        <td className="py-3.5 px-4 whitespace-nowrap text-foreground">
                          <div className="flex items-center gap-1.5">
                            <Calendar className="h-3.5 w-3.5 text-muted-foreground" />
                            <span>{formatDate(rec.next_occurrence)}</span>
                          </div>
                        </td>
                        <td className="py-3.5 px-4 text-right whitespace-nowrap font-bold text-sm">
                          <span
                            className={
                              isExpense
                                ? "text-red-600 dark:text-red-400"
                                : "text-emerald-600 dark:text-emerald-400"
                            }
                          >
                            {isExpense ? "-" : "+"}
                            {formatCurrency(rec.amount)}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 text-center whitespace-nowrap">
                          <Badge variant={rec.is_active ? "success" : "secondary"}>
                            {rec.is_active ? "ACTIVE" : "PAUSED"}
                          </Badge>
                        </td>
                        <td className="py-3.5 px-4 text-center whitespace-nowrap">
                          <div className="flex items-center justify-center gap-1">
                            <button
                              onClick={() => handleToggleActive(rec)}
                              className="p-1.5 rounded-md hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
                              title={rec.is_active ? "Pause schedule" : "Resume schedule"}
                            >
                              {rec.is_active ? (
                                <Pause className="h-3.5 w-3.5 text-amber-500" />
                              ) : (
                                <Play className="h-3.5 w-3.5 text-emerald-500" />
                              )}
                            </button>
                            <button
                              onClick={() => handleDelete(rec.id)}
                              className="p-1.5 rounded-md hover:bg-red-500/10 text-muted-foreground hover:text-red-600 transition-colors"
                              title="Delete schedule"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Schedule Modal */}
      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent onClose={() => setCreateOpen(false)}>
          <DialogHeader>
            <DialogTitle>Create Recurring Schedule</DialogTitle>
            <DialogDescription>
              Automatic idempotent processing generates transactions safely at each scheduled date.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleCreate} className="space-y-4">
            <div className="space-y-1">
              <label className="text-xs font-medium text-muted-foreground">Title / Purpose</label>
              <Input
                placeholder="e.g. Netflix Subscription, Monthly House Rent, Salary"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-xs font-medium text-muted-foreground">Type</label>
                <Select value={type} onChange={(e) => setType(e.target.value as any)}>
                  <option value="expense">Expense</option>
                  <option value="income">Income</option>
                </Select>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-medium text-muted-foreground">Frequency</label>
                <Select value={frequency} onChange={(e) => setFrequency(e.target.value as any)}>
                  <option value="daily">Daily</option>
                  <option value="weekly">Weekly</option>
                  <option value="monthly">Monthly</option>
                  <option value="quarterly">Quarterly (3 months)</option>
                  <option value="yearly">Yearly</option>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-xs font-medium text-muted-foreground">Amount (₹)</label>
                <Input
                  type="number"
                  step="0.01"
                  min="0.01"
                  placeholder="0.00"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  required
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-medium text-muted-foreground">First Due Date</label>
                <Input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-xs font-medium text-muted-foreground">Account</label>
                <Select value={accountId} onChange={(e) => setAccountId(e.target.value)} required>
                  {accounts.map((a) => (
                    <option key={a.id} value={a.id}>
                      {a.name} ({formatCurrency(a.current_balance, a.currency)})
                    </option>
                  ))}
                </Select>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-medium text-muted-foreground">Category</label>
                <Select value={categoryId} onChange={(e) => setCategoryId(e.target.value)}>
                  <option value="">Uncategorized</option>
                  {filteredCategories.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </Select>
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-medium text-muted-foreground">End Date (Optional)</label>
              <Input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                placeholder="Leave blank for ongoing"
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
                Save Schedule
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
