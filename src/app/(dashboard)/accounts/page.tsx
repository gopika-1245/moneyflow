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
  Wallet,
  Building,
  CreditCard,
  Banknote,
  ArrowLeftRight,
  Plus,
  Archive,
  Edit,
  Trash2,
  CheckCircle,
  AlertCircle,
} from "lucide-react";
import { toast } from "sonner";
import { AccountItem } from "@/types/finance";

export default function AccountsPage() {
  const [accounts, setAccounts] = React.useState<AccountItem[]>([]);
  const [loading, setLoading] = React.useState(true);

  // Modals
  const [createOpen, setCreateOpen] = React.useState(false);
  const [transferOpen, setTransferOpen] = React.useState(false);
  const [editItem, setEditItem] = React.useState<AccountItem | null>(null);

  // Create form state
  const [name, setName] = React.useState("");
  const [type, setType] = React.useState<string>("savings");
  const [openingBalance, setOpeningBalance] = React.useState("0");
  const [currency, setCurrency] = React.useState("INR");
  const [institutionName, setInstitutionName] = React.useState("");
  const [description, setDescription] = React.useState("");
  const [formLoading, setFormLoading] = React.useState(false);

  // Transfer form state
  const [fromAccountId, setFromAccountId] = React.useState("");
  const [toAccountId, setToAccountId] = React.useState("");
  const [transferAmount, setTransferAmount] = React.useState("");
  const [transferDate, setTransferDate] = React.useState(new Date().toISOString().split("T")[0]);
  const [transferNotes, setTransferNotes] = React.useState("");
  const [transferLoading, setTransferLoading] = React.useState(false);

  const loadAccounts = React.useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/accounts");
      const json = await res.json();
      if (json.success && json.data) {
        setAccounts(json.data);
      }
    } catch {
      toast.error("Failed to load accounts");
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    loadAccounts();
  }, [loadAccounts]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormLoading(true);
    try {
      const res = await fetch("/api/accounts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          type,
          openingBalance: parseFloat(openingBalance) || 0,
          currency,
          institutionName: institutionName || null,
          description: description || null,
        }),
      });
      const json = await res.json();
      if (!res.ok || !json.success) throw new Error(json.error || "Failed to create account");

      toast.success("Account created successfully");
      setCreateOpen(false);
      setName("");
      setOpeningBalance("0");
      setInstitutionName("");
      setDescription("");
      loadAccounts();
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Error creating account");
    } finally {
      setFormLoading(false);
    }
  };

  const handleTransfer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fromAccountId || !toAccountId || fromAccountId === toAccountId) {
      toast.error("Please select two distinct accounts for the transfer");
      return;
    }
    const amt = parseFloat(transferAmount);
    if (isNaN(amt) || amt <= 0) {
      toast.error("Please enter a valid transfer amount");
      return;
    }

    setTransferLoading(true);
    try {
      const res = await fetch("/api/accounts/transfer", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fromAccountId,
          toAccountId,
          amount: amt,
          date: transferDate,
          notes: transferNotes || null,
        }),
      });

      const json = await res.json();
      if (!res.ok || !json.success) throw new Error(json.error || "Transfer failed");

      toast.success("Transfer completed successfully!");
      setTransferOpen(false);
      setTransferAmount("");
      setTransferNotes("");
      loadAccounts();
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Transfer error");
    } finally {
      setTransferLoading(false);
    }
  };

  const handleArchiveToggle = async (acc: AccountItem) => {
    try {
      const res = await fetch(`/api/accounts/${acc.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isArchived: !acc.is_archived }),
      });
      const json = await res.json();
      if (!res.ok || !json.success) throw new Error(json.error || "Failed");

      toast.success(acc.is_archived ? "Account unarchived" : "Account archived");
      loadAccounts();
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Error updating account");
    }
  };

  const getAccountIcon = (type: string) => {
    switch (type) {
      case "savings":
        return <Building className="h-5 w-5 text-blue-500" />;
      case "current":
        return <Building className="h-5 w-5 text-indigo-500" />;
      case "credit_card":
        return <CreditCard className="h-5 w-5 text-amber-500" />;
      case "cash":
        return <Banknote className="h-5 w-5 text-emerald-500" />;
      default:
        return <Wallet className="h-5 w-5 text-purple-500" />;
    }
  };

  const activeAccounts = accounts.filter((a) => !a.is_archived);
  const archivedAccounts = accounts.filter((a) => a.is_archived);

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground">
            Financial Accounts
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Manage your savings, current, credit cards, and cash wallets.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            onClick={() => {
              if (activeAccounts.length < 2) {
                toast.error("You need at least 2 accounts to make a transfer");
                return;
              }
              setFromAccountId(activeAccounts[0].id);
              setToAccountId(activeAccounts[1].id);
              setTransferOpen(true);
            }}
            className="text-xs sm:text-sm font-semibold"
          >
            <ArrowLeftRight className="h-4 w-4 mr-1.5" /> Transfer Funds
          </Button>
          <Button onClick={() => setCreateOpen(true)} className="text-xs sm:text-sm font-semibold">
            <Plus className="h-4 w-4 mr-1.5" /> New Account
          </Button>
        </div>
      </div>

      {/* Active Accounts Grid */}
      <div>
        <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">
          Active Accounts ({activeAccounts.length})
        </h2>

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[1, 2, 3].map((n) => (
              <Skeleton key={n} className="h-44 w-full rounded-xl" />
            ))}
          </div>
        ) : activeAccounts.length === 0 ? (
          <Card className="p-12 text-center border-dashed border-border">
            <Wallet className="h-10 w-10 text-muted-foreground mx-auto mb-2" />
            <p className="font-bold text-base">No active accounts</p>
            <p className="text-xs text-muted-foreground mt-1">
              Add your bank account, cash wallet, or credit card to get started.
            </p>
            <Button size="sm" onClick={() => setCreateOpen(true)} className="mt-4">
              <Plus className="h-4 w-4 mr-1.5" /> Create Account
            </Button>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {activeAccounts.map((acc) => {
              const isCredit = acc.type === "credit_card";
              return (
                <Card key={acc.id} className="relative group hover:border-emerald-500/50 transition-all">
                  <CardHeader className="flex flex-row items-start justify-between pb-2 space-y-0">
                    <div className="flex items-center gap-3">
                      <div className="p-2.5 rounded-xl bg-muted/60 border border-border">
                        {getAccountIcon(acc.type)}
                      </div>
                      <div>
                        <CardTitle className="text-base font-bold text-foreground truncate max-w-[170px]">
                          {acc.name}
                        </CardTitle>
                        <p className="text-xs text-muted-foreground">
                          {acc.institution_name || acc.type.replace("_", " ").toUpperCase()}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={() => handleArchiveToggle(acc)}
                        className="p-1.5 rounded-md hover:bg-muted text-muted-foreground hover:text-foreground"
                        title="Archive account"
                      >
                        <Archive className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </CardHeader>

                  <CardContent className="pt-2">
                    <div className="space-y-1">
                      <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
                        {isCredit ? "Current Due / Outstanding" : "Available Balance"}
                      </span>
                      <div
                        className={`text-2xl font-black ${
                          isCredit
                            ? "text-amber-600 dark:text-amber-400"
                            : "text-emerald-600 dark:text-emerald-400"
                        }`}
                      >
                        {formatCurrency(acc.current_balance, acc.currency)}
                      </div>
                    </div>

                    <div className="mt-4 pt-3 border-t border-border flex items-center justify-between text-[11px] text-muted-foreground">
                      <span>Opening: {formatCurrency(acc.opening_balance, acc.currency)}</span>
                      <Badge variant="outline" className="text-[10px] uppercase font-semibold">
                        {acc.type.replace("_", " ")}
                      </Badge>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>

      {/* Archived Accounts Accordion */}
      {archivedAccounts.length > 0 && (
        <div className="pt-4">
          <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">
            Archived Accounts ({archivedAccounts.length})
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 opacity-75">
            {archivedAccounts.map((acc) => (
              <Card key={acc.id} className="border-dashed">
                <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                  <div className="flex items-center gap-2">
                    {getAccountIcon(acc.type)}
                    <span className="font-semibold text-sm">{acc.name}</span>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleArchiveToggle(acc)}
                    className="text-xs"
                  >
                    Restore
                  </Button>
                </CardHeader>
                <CardContent>
                  <p className="text-lg font-bold">{formatCurrency(acc.current_balance, acc.currency)}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Create Account Modal */}
      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent onClose={() => setCreateOpen(false)}>
          <DialogHeader>
            <DialogTitle>Add New Financial Account</DialogTitle>
            <DialogDescription>
              Connect a bank, credit card, cash wallet, or savings account.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleCreate} className="space-y-4">
            <div className="space-y-1">
              <label className="text-xs font-medium text-muted-foreground">Account Name</label>
              <Input
                placeholder="e.g. HDFC Salary Account, SBI Savings, Cash Wallet"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-xs font-medium text-muted-foreground">Account Type</label>
                <Select value={type} onChange={(e) => setType(e.target.value)}>
                  <option value="savings">Savings Account</option>
                  <option value="current">Current Account</option>
                  <option value="credit_card">Credit Card</option>
                  <option value="cash">Cash in Hand</option>
                  <option value="wallet">Digital Wallet (Paytm/Amazon Pay)</option>
                  <option value="other">Other Asset</option>
                </Select>
              </div>
              <div className="space-y-1">
                <label className="text-xs font-medium text-muted-foreground">Opening Balance (₹)</label>
                <Input
                  type="number"
                  step="0.01"
                  value={openingBalance}
                  onChange={(e) => setOpeningBalance(e.target.value)}
                  placeholder="0.00"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-xs font-medium text-muted-foreground">Bank / Institution (Optional)</label>
                <Input
                  placeholder="e.g. HDFC Bank, ICICI"
                  value={institutionName}
                  onChange={(e) => setInstitutionName(e.target.value)}
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-medium text-muted-foreground">Currency</label>
                <Select value={currency} onChange={(e) => setCurrency(e.target.value)}>
                  <option value="INR">INR (₹)</option>
                  <option value="USD">USD ($)</option>
                  <option value="EUR">EUR (€)</option>
                  <option value="GBP">GBP (£)</option>
                </Select>
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-medium text-muted-foreground">Notes / Description (Optional)</label>
              <Input
                placeholder="Account purpose or last 4 digits..."
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
                Create Account
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Transfer Funds Modal */}
      <Dialog open={transferOpen} onOpenChange={setTransferOpen}>
        <DialogContent onClose={() => setTransferOpen(false)}>
          <DialogHeader>
            <DialogTitle>Transfer Money Between Accounts</DialogTitle>
            <DialogDescription>
              Executes atomically: updates both account balances without affecting cash flow reports.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleTransfer} className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-xs font-medium text-muted-foreground">Source Account</label>
                <Select value={fromAccountId} onChange={(e) => setFromAccountId(e.target.value)} required>
                  {activeAccounts.map((a) => (
                    <option key={a.id} value={a.id}>
                      {a.name} ({formatCurrency(a.current_balance, a.currency)})
                    </option>
                  ))}
                </Select>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-medium text-muted-foreground">Destination Account</label>
                <Select value={toAccountId} onChange={(e) => setToAccountId(e.target.value)} required>
                  {activeAccounts
                    .filter((a) => a.id !== fromAccountId)
                    .map((a) => (
                      <option key={a.id} value={a.id}>
                        {a.name} ({formatCurrency(a.current_balance, a.currency)})
                      </option>
                    ))}
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-xs font-medium text-muted-foreground">Transfer Amount (₹)</label>
                <Input
                  type="number"
                  step="0.01"
                  min="0.01"
                  placeholder="0.00"
                  value={transferAmount}
                  onChange={(e) => setTransferAmount(e.target.value)}
                  required
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-medium text-muted-foreground">Transfer Date</label>
                <Input
                  type="date"
                  value={transferDate}
                  onChange={(e) => setTransferDate(e.target.value)}
                  required
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-medium text-muted-foreground">Notes (Optional)</label>
              <Input
                placeholder="e.g. Monthly savings contribution, credit card bill payment"
                value={transferNotes}
                onChange={(e) => setTransferNotes(e.target.value)}
              />
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setTransferOpen(false)}
                disabled={transferLoading}
              >
                Cancel
              </Button>
              <Button type="submit" isLoading={transferLoading}>
                Execute Transfer
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
