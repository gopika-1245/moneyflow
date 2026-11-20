"use client";

import * as React from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/ui/dialog";
import { Button } from "@/ui/button";
import { Input } from "@/ui/input";
import { Select } from "@/ui/select";
import { Plus, ArrowDownRight, ArrowUpRight, ArrowLeftRight } from "lucide-react";
import { toast } from "sonner";
import { AccountItem, CategoryItem } from "@/types/finance";

interface QuickAddModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

export function QuickAddModal({ open, onOpenChange, onSuccess }: QuickAddModalProps) {
  const [type, setType] = React.useState<"expense" | "income" | "transfer">("expense");
  const [title, setTitle] = React.useState("");
  const [amount, setAmount] = React.useState("");
  const [accountId, setAccountId] = React.useState("");
  const [toAccountId, setToAccountId] = React.useState("");
  const [categoryId, setCategoryId] = React.useState("");
  const [date, setDate] = React.useState(new Date().toISOString().split("T")[0]);
  const [paymentMethod, setPaymentMethod] = React.useState("Online / UPI");
  const [notes, setNotes] = React.useState("");
  const [loading, setLoading] = React.useState(false);

  const [accounts, setAccounts] = React.useState<AccountItem[]>([]);
  const [categories, setCategories] = React.useState<CategoryItem[]>([]);

  React.useEffect(() => {
    if (open) {
      // Load accounts and categories
      fetch("/api/accounts")
        .then((res) => res.json())
        .then((json) => {
          if (json.success && json.data) {
            setAccounts(json.data);
            if (json.data.length > 0 && !accountId) {
              setAccountId(json.data[0].id);
              if (json.data.length > 1) {
                setToAccountId(json.data[1].id);
              }
            }
          }
        })
        .catch(() => {});

      fetch("/api/categories")
        .then((res) => res.json())
        .then((json) => {
          if (json.success && json.data) {
            setCategories(json.data);
          }
        })
        .catch(() => {});
    }
  }, [open, accountId]);

  const filteredCategories = categories.filter((c) =>
    type === "transfer" ? false : c.type === type
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title) {
      toast.error("Please enter a transaction title");
      return;
    }
    const numAmount = parseFloat(amount);
    if (isNaN(numAmount) || numAmount <= 0) {
      toast.error("Please enter a valid amount greater than 0");
      return;
    }
    if (!accountId) {
      toast.error("Please select an account");
      return;
    }
    if (type === "transfer" && (!toAccountId || toAccountId === accountId)) {
      toast.error("Source and destination accounts must be different");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/transactions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          amount: numAmount,
          type,
          accountId,
          toAccountId: type === "transfer" ? toAccountId : null,
          categoryId: type !== "transfer" && categoryId ? categoryId : null,
          date,
          paymentMethod,
          notes,
        }),
      });

      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error || "Failed to save transaction");
      }

      toast.success(
        type === "expense"
          ? "Expense recorded successfully!"
          : type === "income"
          ? "Income added successfully!"
          : "Transfer completed successfully!"
      );

      // Reset form
      setTitle("");
      setAmount("");
      setNotes("");
      onOpenChange(false);
      if (onSuccess) onSuccess();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Error saving transaction";
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent onClose={() => onOpenChange(false)}>
        <DialogHeader>
          <DialogTitle>Quick Add Transaction</DialogTitle>
          <DialogDescription>
            Record new income, expense, or transfer immediately.
          </DialogDescription>
        </DialogHeader>

        {/* Type Selector Tabs */}
        <div className="grid grid-cols-3 gap-2 mb-4 p-1 bg-muted rounded-lg">
          <button
            type="button"
            onClick={() => setType("expense")}
            className={`flex items-center justify-center gap-1.5 py-1.5 text-xs font-semibold rounded-md transition-all ${
              type === "expense"
                ? "bg-card text-red-600 shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <ArrowDownRight className="h-3.5 w-3.5" />
            Expense
          </button>
          <button
            type="button"
            onClick={() => setType("income")}
            className={`flex items-center justify-center gap-1.5 py-1.5 text-xs font-semibold rounded-md transition-all ${
              type === "income"
                ? "bg-card text-emerald-600 shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <ArrowUpRight className="h-3.5 w-3.5" />
            Income
          </button>
          <button
            type="button"
            onClick={() => setType("transfer")}
            className={`flex items-center justify-center gap-1.5 py-1.5 text-xs font-semibold rounded-md transition-all ${
              type === "transfer"
                ? "bg-card text-blue-600 shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <ArrowLeftRight className="h-3.5 w-3.5" />
            Transfer
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1">
            <label className="text-xs font-medium text-muted-foreground">Title / Merchant</label>
            <Input
              placeholder={
                type === "expense"
                  ? "e.g. Grocery store, Fuel, Netflix"
                  : type === "income"
                  ? "e.g. Monthly Salary, Freelance project"
                  : "e.g. Transfer to Savings"
              }
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
            />
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
              <label className="text-xs font-medium text-muted-foreground">Date</label>
              <Input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-xs font-medium text-muted-foreground">
                {type === "transfer" ? "From Account" : "Account"}
              </label>
              <Select value={accountId} onChange={(e) => setAccountId(e.target.value)} required>
                {accounts.map((acc) => (
                  <option key={acc.id} value={acc.id}>
                    {acc.name} ({acc.currency} {Number(acc.current_balance).toFixed(2)})
                  </option>
                ))}
              </Select>
            </div>

            {type === "transfer" ? (
              <div className="space-y-1">
                <label className="text-xs font-medium text-muted-foreground">To Account</label>
                <Select
                  value={toAccountId}
                  onChange={(e) => setToAccountId(e.target.value)}
                  required
                >
                  <option value="">Select destination</option>
                  {accounts
                    .filter((a) => a.id !== accountId)
                    .map((acc) => (
                      <option key={acc.id} value={acc.id}>
                        {acc.name} ({acc.currency} {Number(acc.current_balance).toFixed(2)})
                      </option>
                    ))}
                </Select>
              </div>
            ) : (
              <div className="space-y-1">
                <label className="text-xs font-medium text-muted-foreground">Category</label>
                <Select value={categoryId} onChange={(e) => setCategoryId(e.target.value)}>
                  <option value="">Select category</option>
                  {filteredCategories.map((cat) => (
                    <option key={cat.id} value={cat.id}>
                      {cat.name}
                    </option>
                  ))}
                </Select>
              </div>
            )}
          </div>

          <div className="space-y-1">
            <label className="text-xs font-medium text-muted-foreground">Notes (Optional)</label>
            <Input
              placeholder="Additional details..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button type="submit" isLoading={loading}>
              <Plus className="h-4 w-4 mr-1.5" />
              Save Transaction
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
