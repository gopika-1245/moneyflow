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
  BellRing,
  Plus,
  Trash2,
  CheckCircle2,
  Clock,
  AlertTriangle,
  Calendar,
} from "lucide-react";
import { toast } from "sonner";
import { ReminderItem, CategoryItem } from "@/types/finance";
import { isBefore, parseISO, startOfDay } from "date-fns";

export default function RemindersPage() {
  const [reminders, setReminders] = React.useState<ReminderItem[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [createOpen, setCreateOpen] = React.useState(false);

  // Form state
  const [title, setTitle] = React.useState("");
  const [description, setDescription] = React.useState("");
  const [dueDate, setDueDate] = React.useState(new Date().toISOString().split("T")[0]);
  const [amount, setAmount] = React.useState("");
  const [categoryId, setCategoryId] = React.useState("");
  const [recurrence, setRecurrence] = React.useState("none");
  const [formLoading, setFormLoading] = React.useState(false);

  const [categories, setCategories] = React.useState<CategoryItem[]>([]);

  React.useEffect(() => {
    fetch("/api/categories")
      .then((r) => r.json())
      .then((j) => j.success && setCategories(j.data || []))
      .catch(() => {});
  }, []);

  const loadReminders = React.useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/reminders");
      const json = await res.json();
      if (json.success && json.data) {
        setReminders(json.data);
      }
    } catch {
      toast.error("Failed to load reminders");
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    loadReminders();
  }, [loadReminders]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormLoading(true);
    try {
      const res = await fetch("/api/reminders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          description: description || null,
          dueDate,
          amount: amount ? parseFloat(amount) : null,
          categoryId: categoryId || null,
          recurrence,
        }),
      });

      const json = await res.json();
      if (!res.ok || !json.success) throw new Error(json.error || "Failed to create reminder");

      toast.success("Reminder created successfully");
      setCreateOpen(false);
      setTitle("");
      setDescription("");
      setAmount("");
      loadReminders();
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Error saving reminder");
    } finally {
      setFormLoading(false);
    }
  };

  const handleToggleStatus = async (item: ReminderItem) => {
    const newStatus = item.status === "completed" ? "pending" : "completed";
    try {
      const res = await fetch(`/api/reminders/${item.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });
      const json = await res.json();
      if (!res.ok || !json.success) throw new Error(json.error || "Failed");

      toast.success(newStatus === "completed" ? "Marked as paid / completed!" : "Marked as pending");
      loadReminders();
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Error updating reminder");
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this reminder?")) return;
    try {
      const res = await fetch(`/api/reminders/${id}`, { method: "DELETE" });
      const json = await res.json();
      if (!res.ok || !json.success) throw new Error(json.error || "Failed");

      toast.success("Reminder deleted");
      loadReminders();
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Error deleting reminder");
    }
  };

  const today = startOfDay(new Date());

  const pendingReminders = reminders.filter((r) => r.status === "pending");
  const overdueReminders = pendingReminders.filter((r) => isBefore(startOfDay(parseISO(r.due_date)), today));
  const upcomingReminders = pendingReminders.filter((r) => !isBefore(startOfDay(parseISO(r.due_date)), today));
  const completedReminders = reminders.filter((r) => r.status === "completed");

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground">
            Financial Reminders
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Never miss credit card dues, utility bills, rent deadlines, or loan payments.
          </p>
        </div>

        <Button onClick={() => setCreateOpen(true)} className="text-xs sm:text-sm font-semibold">
          <Plus className="h-4 w-4 mr-1.5" /> Add Reminder
        </Button>
      </div>

      {/* KPI Overview */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className={overdueReminders.length > 0 ? "border-red-500/50 bg-red-500/5" : ""}>
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Overdue Payments
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-black ${overdueReminders.length > 0 ? "text-red-600" : "text-foreground"}`}>
              {overdueReminders.length}
            </div>
            <p className="text-[11px] text-muted-foreground mt-1">Requires immediate attention</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Upcoming Dues
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-black text-foreground">{upcomingReminders.length}</div>
            <p className="text-[11px] text-muted-foreground mt-1">Scheduled for this month</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Settled / Completed
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-black text-emerald-600 dark:text-emerald-400">
              {completedReminders.length}
            </div>
            <p className="text-[11px] text-muted-foreground mt-1">Marked as paid</p>
          </CardContent>
        </Card>
      </div>

      {/* Overdue Section (Alert Callout) */}
      {overdueReminders.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center gap-2 text-sm font-bold text-red-600">
            <AlertTriangle className="h-4 w-4" /> Overdue Payments ({overdueReminders.length})
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {overdueReminders.map((rem) => (
              <Card key={rem.id} className="border-red-500/60 bg-red-500/5 shadow-sm">
                <CardHeader className="flex flex-row items-start justify-between pb-2 space-y-0">
                  <div>
                    <CardTitle className="text-base font-bold text-foreground truncate max-w-[200px]">
                      {rem.title}
                    </CardTitle>
                    <p className="text-xs text-red-600 font-semibold mt-0.5">
                      Due: {formatDate(rem.due_date)} (Overdue)
                    </p>
                  </div>
                  <Badge variant="destructive">OVERDUE</Badge>
                </CardHeader>
                <CardContent className="space-y-3 pt-1">
                  {rem.amount && (
                    <div className="text-xl font-black text-foreground">
                      {formatCurrency(rem.amount)}
                    </div>
                  )}
                  {rem.description && (
                    <p className="text-xs text-muted-foreground">{rem.description}</p>
                  )}
                  <div className="pt-2 flex items-center justify-between border-t border-border">
                    <Button size="sm" onClick={() => handleToggleStatus(rem)} className="text-xs">
                      <CheckCircle2 className="h-3.5 w-3.5 mr-1" /> Mark Paid
                    </Button>
                    <button
                      onClick={() => handleDelete(rem.id)}
                      className="p-1.5 text-muted-foreground hover:text-red-600"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Upcoming Reminders */}
      <div className="space-y-3">
        <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
          Upcoming Schedule ({upcomingReminders.length})
        </h2>

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[1, 2, 3].map((n) => (
              <Skeleton key={n} className="h-40 w-full rounded-xl" />
            ))}
          </div>
        ) : upcomingReminders.length === 0 ? (
          <Card className="p-12 text-center border-dashed border-border">
            <BellRing className="h-10 w-10 text-muted-foreground mx-auto mb-2" />
            <p className="font-bold text-base">No upcoming reminders</p>
            <p className="text-xs text-muted-foreground mt-1">
              Add bill payment reminders to avoid late fees on cards or utilities.
            </p>
            <Button size="sm" onClick={() => setCreateOpen(true)} className="mt-4">
              <Plus className="h-4 w-4 mr-1.5" /> Set Reminder
            </Button>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {upcomingReminders.map((rem) => (
              <Card key={rem.id} className="hover:border-emerald-500/40 transition-all">
                <CardHeader className="flex flex-row items-start justify-between pb-2 space-y-0">
                  <div>
                    <CardTitle className="text-base font-bold text-foreground">
                      {rem.title}
                    </CardTitle>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      Due: {formatDate(rem.due_date)}
                    </p>
                  </div>
                  <Badge variant="outline" className="text-[10px] uppercase">
                    {rem.recurrence}
                  </Badge>
                </CardHeader>
                <CardContent className="space-y-3 pt-1">
                  {rem.amount && (
                    <div className="text-xl font-black text-foreground">
                      {formatCurrency(rem.amount)}
                    </div>
                  )}
                  {rem.description && (
                    <p className="text-xs text-muted-foreground line-clamp-2">{rem.description}</p>
                  )}
                  <div className="pt-2 flex items-center justify-between border-t border-border">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleToggleStatus(rem)}
                      className="text-xs font-semibold"
                    >
                      <CheckCircle2 className="h-3.5 w-3.5 mr-1" /> Mark Done
                    </Button>
                    <button
                      onClick={() => handleDelete(rem.id)}
                      className="p-1.5 text-muted-foreground hover:text-red-600"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Completed Reminders Accordion */}
      {completedReminders.length > 0 && (
        <div className="pt-4 space-y-3">
          <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
            Completed Reminders ({completedReminders.length})
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 opacity-70">
            {completedReminders.map((rem) => (
              <Card key={rem.id} className="border-dashed">
                <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                  <span className="font-semibold text-sm line-through text-muted-foreground">
                    {rem.title}
                  </span>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleToggleStatus(rem)}
                    className="text-xs"
                  >
                    Undo
                  </Button>
                </CardHeader>
                {rem.amount && (
                  <CardContent className="pt-0 text-sm font-bold">
                    {formatCurrency(rem.amount)}
                  </CardContent>
                )}
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Create Reminder Modal */}
      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent onClose={() => setCreateOpen(false)}>
          <DialogHeader>
            <DialogTitle>Create Financial Reminder</DialogTitle>
            <DialogDescription>
              Schedule reminders for upcoming bills, subscriptions, or loan EMIs.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleCreate} className="space-y-4">
            <div className="space-y-1">
              <label className="text-xs font-medium text-muted-foreground">Title</label>
              <Input
                placeholder="e.g. Electricity Bill, Credit Card EMI, Rent"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-xs font-medium text-muted-foreground">Due Date</label>
                <Input
                  type="date"
                  value={dueDate}
                  onChange={(e) => setDueDate(e.target.value)}
                  required
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-medium text-muted-foreground">Amount (Optional)</label>
                <Input
                  type="number"
                  step="0.01"
                  placeholder="0.00"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-xs font-medium text-muted-foreground">Recurrence</label>
                <Select value={recurrence} onChange={(e) => setRecurrence(e.target.value)}>
                  <option value="none">One-time only</option>
                  <option value="daily">Daily</option>
                  <option value="weekly">Weekly</option>
                  <option value="monthly">Monthly</option>
                  <option value="yearly">Yearly</option>
                </Select>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-medium text-muted-foreground">Category (Optional)</label>
                <Select value={categoryId} onChange={(e) => setCategoryId(e.target.value)}>
                  <option value="">Select category</option>
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </Select>
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-medium text-muted-foreground">Description / Account Reference</label>
              <Input
                placeholder="Bill number, customer ID, or payment notes..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
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
                Set Reminder
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
