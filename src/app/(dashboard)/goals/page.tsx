"use client";

import * as React from "react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/ui/card";
import { Button } from "@/ui/button";
import { Input } from "@/ui/input";
import { Badge } from "@/ui/badge";
import { Skeleton } from "@/ui/skeleton";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/ui/dialog";
import { formatCurrency, formatDate } from "@/lib/utils";
import {
  Target,
  Plus,
  Trash2,
  CheckCircle2,
  Clock,
  Sparkles,
  ChevronRight,
  TrendingUp,
  History,
} from "lucide-react";
import { toast } from "sonner";
import { SavingsGoalItem } from "@/types/finance";

export default function SavingsGoalsPage() {
  const [goals, setGoals] = React.useState<SavingsGoalItem[]>([]);
  const [loading, setLoading] = React.useState(true);

  // Modals
  const [createOpen, setCreateOpen] = React.useState(false);
  const [contributeOpen, setContributeOpen] = React.useState(false);
  const [selectedGoal, setSelectedGoal] = React.useState<SavingsGoalItem | null>(null);

  // Create form state
  const [name, setName] = React.useState("");
  const [description, setDescription] = React.useState("");
  const [targetAmount, setTargetAmount] = React.useState("");
  const [initialAmount, setInitialAmount] = React.useState("0");
  const [targetDate, setTargetDate] = React.useState("");
  const [formLoading, setFormLoading] = React.useState(false);

  // Contribution form state
  const [contributionAmount, setContributionAmount] = React.useState("");
  const [contributionDate, setContributionDate] = React.useState(
    new Date().toISOString().split("T")[0]
  );
  const [contributionNotes, setContributionNotes] = React.useState("");
  const [contribLoading, setContribLoading] = React.useState(false);

  const loadGoals = React.useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/goals");
      const json = await res.json();
      if (json.success && json.data) {
        setGoals(json.data);
      }
    } catch {
      toast.error("Failed to load savings goals");
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    loadGoals();
  }, [loadGoals]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    const target = parseFloat(targetAmount);
    if (isNaN(target) || target <= 0) {
      toast.error("Please enter a valid target amount");
      return;
    }

    setFormLoading(true);
    try {
      const res = await fetch("/api/goals", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          description: description || null,
          targetAmount: target,
          currentAmount: parseFloat(initialAmount) || 0,
          targetDate: targetDate || null,
        }),
      });

      const json = await res.json();
      if (!res.ok || !json.success) throw new Error(json.error || "Failed to create goal");

      toast.success("Savings goal created!");
      setCreateOpen(false);
      setName("");
      setDescription("");
      setTargetAmount("");
      setInitialAmount("0");
      setTargetDate("");
      loadGoals();
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Error creating goal");
    } finally {
      setFormLoading(false);
    }
  };

  const handleContribute = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedGoal) return;

    const amt = parseFloat(contributionAmount);
    if (isNaN(amt) || amt === 0) {
      toast.error("Please enter a non-zero contribution or correction amount");
      return;
    }

    setContribLoading(true);
    try {
      const res = await fetch(`/api/goals/${selectedGoal.id}/contributions`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          amount: amt,
          date: contributionDate,
          notes: contributionNotes || null,
        }),
      });

      const json = await res.json();
      if (!res.ok || !json.success) throw new Error(json.error || "Failed to add contribution");

      toast.success(
        amt > 0 ? "Deposit added to savings goal!" : "Auditable correction recorded"
      );
      setContributeOpen(false);
      setContributionAmount("");
      setContributionNotes("");
      loadGoals();
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Error adding contribution");
    } finally {
      setContribLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this savings goal?")) return;
    try {
      const res = await fetch(`/api/goals/${id}`, { method: "DELETE" });
      const json = await res.json();
      if (!res.ok || !json.success) throw new Error(json.error || "Failed to delete");
      toast.success("Savings goal deleted");
      loadGoals();
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Error deleting goal");
    }
  };

  const activeGoals = goals.filter((g) => g.status === "active");
  const completedGoals = goals.filter((g) => g.status === "completed");

  const totalSaved = goals.reduce((sum, g) => sum + Number(g.current_amount), 0);
  const totalTarget = goals.reduce((sum, g) => sum + Number(g.target_amount), 0);

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground">
            Savings Goals
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Plan, contribute, and track progress toward your dreams and emergency funds.
          </p>
        </div>

        <Button onClick={() => setCreateOpen(true)} className="text-xs sm:text-sm font-semibold">
          <Plus className="h-4 w-4 mr-1.5" /> Create Goal
        </Button>
      </div>

      {/* KPI Overview */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Total Saved So Far
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-black text-emerald-600 dark:text-emerald-400">
              {formatCurrency(totalSaved)}
            </div>
            <p className="text-[11px] text-muted-foreground mt-1">Accumulated across all targets</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Target Value
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-black text-foreground">
              {formatCurrency(totalTarget)}
            </div>
            <p className="text-[11px] text-muted-foreground mt-1">
              {totalTarget > 0 ? ((totalSaved / totalTarget) * 100).toFixed(1) : 0}% aggregate progress
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Goals Status
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-black text-foreground">
              {activeGoals.length} Active / {completedGoals.length} Achieved
            </div>
            <div className="mt-1">
              <Badge variant="success">{completedGoals.length} Goals Completed</Badge>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Active Goals Grid */}
      <div>
        <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">
          Active Targets ({activeGoals.length})
        </h2>

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[1, 2, 3].map((n) => (
              <Skeleton key={n} className="h-48 w-full rounded-xl" />
            ))}
          </div>
        ) : activeGoals.length === 0 ? (
          <Card className="p-12 text-center border-dashed border-border">
            <Target className="h-10 w-10 text-muted-foreground mx-auto mb-2" />
            <p className="font-bold text-base">No active savings goals</p>
            <p className="text-xs text-muted-foreground mt-1 max-w-sm mx-auto">
              Create a goal for an Emergency Fund, Vacation, New Laptop, or Vehicle to start building wealth systematically.
            </p>
            <Button size="sm" onClick={() => setCreateOpen(true)} className="mt-4">
              <Plus className="h-4 w-4 mr-1.5" /> Create Savings Goal
            </Button>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {activeGoals.map((g) => {
              const isDone = g.current_amount >= g.target_amount;
              return (
                <Card key={g.id} className="relative group hover:border-emerald-500/40 transition-all flex flex-col justify-between">
                  <div>
                    <CardHeader className="flex flex-row items-start justify-between pb-2 space-y-0">
                      <div>
                        <CardTitle className="text-base font-bold text-foreground">
                          {g.name}
                        </CardTitle>
                        {g.description && (
                          <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">
                            {g.description}
                          </p>
                        )}
                      </div>

                      <button
                        onClick={() => handleDelete(g.id)}
                        className="p-1.5 rounded-md text-muted-foreground hover:text-red-600 hover:bg-muted opacity-0 group-hover:opacity-100 transition-opacity"
                        title="Delete goal"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </CardHeader>

                    <CardContent className="space-y-3 pt-2">
                      <div className="flex items-baseline justify-between text-xs">
                        <span className="text-muted-foreground">Saved</span>
                        <div className="text-right">
                          <span className="font-extrabold text-base text-emerald-600 dark:text-emerald-400">
                            {formatCurrency(g.current_amount)}
                          </span>
                          <span className="text-muted-foreground text-xs">
                            {" "}
                            / {formatCurrency(g.target_amount)}
                          </span>
                        </div>
                      </div>

                      {/* Progress Bar */}
                      <div className="w-full bg-muted rounded-full h-2.5 overflow-hidden">
                        <div
                          className="h-full bg-emerald-500 rounded-full transition-all duration-300"
                          style={{
                            width: `${Math.min(
                              100,
                              (Number(g.current_amount) / Number(g.target_amount)) * 100
                            )}%`,
                          }}
                        />
                      </div>

                      <div className="flex items-center justify-between text-[11px] text-muted-foreground pt-0.5">
                        <span className="font-semibold text-foreground">
                          {((Number(g.current_amount) / Number(g.target_amount)) * 100).toFixed(1)}% complete
                        </span>
                        <span>{formatCurrency(g.remaining_amount)} remaining</span>
                      </div>

                      {g.target_date && (
                        <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground pt-1">
                          <Clock className="h-3 w-3" />
                          <span>Target date: {formatDate(g.target_date)}</span>
                        </div>
                      )}
                    </CardContent>
                  </div>

                  {/* Card Bottom CTA */}
                  <div className="p-4 pt-0">
                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full font-semibold"
                      onClick={() => {
                        setSelectedGoal(g);
                        setContributeOpen(true);
                      }}
                    >
                      <Plus className="h-3.5 w-3.5 mr-1" /> Add Contribution / Correct
                    </Button>
                  </div>
                </Card>
              );
            })}
          </div>
        )}
      </div>

      {/* Completed Goals */}
      {completedGoals.length > 0 && (
        <div className="pt-4">
          <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">
            Completed Goals ({completedGoals.length})
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {completedGoals.map((g) => (
              <Card key={g.id} className="border-emerald-500/30 bg-emerald-500/5">
                <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="h-5 w-5 text-emerald-600" />
                    <div>
                      <CardTitle className="text-sm font-bold">{g.name}</CardTitle>
                      <p className="text-[11px] text-muted-foreground">Goal Achieved!</p>
                    </div>
                  </div>
                  <Badge variant="success">100% DONE</Badge>
                </CardHeader>
                <CardContent className="pt-2">
                  <p className="text-lg font-black text-foreground">
                    {formatCurrency(g.current_amount)}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Create Goal Modal */}
      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent onClose={() => setCreateOpen(false)}>
          <DialogHeader>
            <DialogTitle>Create New Savings Goal</DialogTitle>
            <DialogDescription>
              Set a target for your emergency buffer, dream purchase, or investment.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleCreate} className="space-y-4">
            <div className="space-y-1">
              <label className="text-xs font-medium text-muted-foreground">Goal Name</label>
              <Input
                placeholder="e.g. 6-Month Emergency Buffer, New MacBook Pro, Bali Trip"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-xs font-medium text-muted-foreground">Target Amount (₹)</label>
                <Input
                  type="number"
                  step="0.01"
                  min="1"
                  placeholder="e.g. 150000"
                  value={targetAmount}
                  onChange={(e) => setTargetAmount(e.target.value)}
                  required
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-medium text-muted-foreground">Starting Amount (₹)</label>
                <Input
                  type="number"
                  step="0.01"
                  placeholder="0.00"
                  value={initialAmount}
                  onChange={(e) => setInitialAmount(e.target.value)}
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-medium text-muted-foreground">Target Completion Date (Optional)</label>
              <Input
                type="date"
                value={targetDate}
                onChange={(e) => setTargetDate(e.target.value)}
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-medium text-muted-foreground">Description / Notes</label>
              <Input
                placeholder="Why are you saving for this?"
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
                Create Goal
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Contribution Modal */}
      {selectedGoal && (
        <Dialog open={contributeOpen} onOpenChange={setContributeOpen}>
          <DialogContent onClose={() => setContributeOpen(false)}>
            <DialogHeader>
              <DialogTitle>Contribute to {selectedGoal.name}</DialogTitle>
              <DialogDescription>
                Record a deposit toward this goal, or enter a negative value for an auditable correction.
              </DialogDescription>
            </DialogHeader>

            <form onSubmit={handleContribute} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-medium text-muted-foreground">
                    Contribution Amount (₹)
                  </label>
                  <Input
                    type="number"
                    step="0.01"
                    placeholder="e.g. 5000 or -2000"
                    value={contributionAmount}
                    onChange={(e) => setContributionAmount(e.target.value)}
                    required
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-medium text-muted-foreground">Date</label>
                  <Input
                    type="date"
                    value={contributionDate}
                    onChange={(e) => setContributionDate(e.target.value)}
                    required
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-medium text-muted-foreground">Notes (Optional)</label>
                <Input
                  placeholder="e.g. Salary bonus deposit"
                  value={contributionNotes}
                  onChange={(e) => setContributionNotes(e.target.value)}
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setContributeOpen(false)}
                  disabled={contribLoading}
                >
                  Cancel
                </Button>
                <Button type="submit" isLoading={contribLoading}>
                  Save Contribution
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
