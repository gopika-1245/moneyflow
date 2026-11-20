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
  Plus,
  Search,
  Filter,
  Download,
  Trash2,
  Edit,
  ArrowUpRight,
  ArrowDownRight,
  ArrowLeftRight,
  ChevronLeft,
  ChevronRight,
  RefreshCw,
  FileText,
} from "lucide-react";
import { toast } from "sonner";
import { QuickAddModal } from "@/components/layout/quick-add-modal";
import { TransactionItem } from "@/types/finance";

export default function TransactionsPage() {
  const [transactions, setTransactions] = React.useState<any[]>([]);
  const [pagination, setPagination] = React.useState({
    page: 1,
    limit: 15,
    totalItems: 0,
    totalPages: 1,
  });
  const [loading, setLoading] = React.useState(true);

  // Filters
  const [search, setSearch] = React.useState("");
  const [type, setType] = React.useState("");
  const [categoryId, setCategoryId] = React.useState("");
  const [accountId, setAccountId] = React.useState("");
  const [startDate, setStartDate] = React.useState("");
  const [endDate, setEndDate] = React.useState("");

  // Modals & Options
  const [quickAddOpen, setQuickAddOpen] = React.useState(false);
  const [editItem, setEditItem] = React.useState<any>(null);
  const [categories, setCategories] = React.useState<any[]>([]);
  const [accounts, setAccounts] = React.useState<any[]>([]);

  // Edit form state
  const [editTitle, setEditTitle] = React.useState("");
  const [editAmount, setEditAmount] = React.useState("");
  const [editDate, setEditDate] = React.useState("");
  const [editCategoryId, setEditCategoryId] = React.useState("");
  const [editAccountId, setEditAccountId] = React.useState("");
  const [editPaymentMethod, setEditPaymentMethod] = React.useState("");
  const [editNotes, setEditNotes] = React.useState("");
  const [editLoading, setEditLoading] = React.useState(false);

  // Load dropdown options
  React.useEffect(() => {
    fetch("/api/categories")
      .then((r) => r.json())
      .then((j) => j.success && setCategories(j.data || []))
      .catch(() => {});

    fetch("/api/accounts")
      .then((r) => r.json())
      .then((j) => j.success && setAccounts(j.data || []))
      .catch(() => {});
  }, []);

  const paginationRef = React.useRef(pagination);
  React.useEffect(() => {
    paginationRef.current = pagination;
  }, [pagination]);

  const loadTransactions = React.useCallback(
    async (pageToLoad?: number) => {
      setLoading(true);
      const targetPage = pageToLoad ?? paginationRef.current.page;
      try {
        const params = new URLSearchParams({
          page: String(targetPage),
          limit: String(paginationRef.current.limit),
        });
        if (search) params.set("search", search);
        if (type) params.set("type", type);
        if (categoryId) params.set("categoryId", categoryId);
        if (accountId) params.set("accountId", accountId);
        if (startDate) params.set("startDate", startDate);
        if (endDate) params.set("endDate", endDate);

        const res = await fetch(`/api/transactions?${params.toString()}`);
        const json = await res.json();
        if (json.success && json.data) {
          setTransactions(json.data.transactions || []);
          if (json.data.pagination) {
            setPagination(json.data.pagination);
          }
        }
      } catch {
        toast.error("Error loading transactions");
      } finally {
        setLoading(false);
      }
    },
    [search, type, categoryId, accountId, startDate, endDate]
  );

  React.useEffect(() => {
    loadTransactions(1);
  }, [loadTransactions]);

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this transaction? Account balances will be safely restored.")) {
      return;
    }
    try {
      const res = await fetch(`/api/transactions/${id}`, { method: "DELETE" });
      const json = await res.json();
      if (!res.ok || !json.success) throw new Error(json.error || "Failed to delete");
      toast.success("Transaction deleted successfully");
      loadTransactions();
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Error deleting transaction");
    }
  };

  const openEditModal = (tx: TransactionItem) => {
    setEditItem(tx);
    setEditTitle(tx.title);
    setEditAmount(String(tx.amount));
    setEditDate(tx.date);
    setEditCategoryId(tx.category_id || "");
    setEditAccountId(tx.account_id);
    setEditPaymentMethod(tx.payment_method || "");
    setEditNotes(tx.notes || "");
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editItem) return;

    setEditLoading(true);
    try {
      const res = await fetch(`/api/transactions/${editItem.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: editTitle,
          amount: parseFloat(editAmount),
          date: editDate,
          categoryId: editCategoryId || null,
          accountId: editAccountId,
          paymentMethod: editPaymentMethod || null,
          notes: editNotes || null,
        }),
      });
      const json = await res.json();
      if (!res.ok || !json.success) throw new Error(json.error || "Failed to update");

      toast.success("Transaction updated successfully");
      setEditItem(null);
      loadTransactions();
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Error updating transaction");
    } finally {
      setEditLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground">
            Transactions
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Search, filter, edit, and export your entire financial history.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <a
            href="/api/reports/export/csv"
            download
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg border border-border bg-card text-xs font-semibold text-foreground hover:bg-muted transition-colors shadow-sm"
          >
            <Download className="h-4 w-4" /> Export CSV
          </a>
          <a
            href="/api/reports/export/pdf"
            download
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg border border-border bg-card text-xs font-semibold text-foreground hover:bg-muted transition-colors shadow-sm"
          >
            <FileText className="h-4 w-4" /> Export PDF
          </a>
          <Button onClick={() => setQuickAddOpen(true)} className="text-xs sm:text-sm font-semibold">
            <Plus className="h-4 w-4 mr-1.5" /> Add Transaction
          </Button>
        </div>
      </div>

      {/* Filter and Search Bar Card */}
      <Card>
        <CardContent className="p-4 space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-3">
            {/* Search Input */}
            <div className="relative lg:col-span-2">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search description, merchant..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9"
              />
            </div>

            {/* Type Filter */}
            <div>
              <Select value={type} onChange={(e) => setType(e.target.value)}>
                <option value="">All Types</option>
                <option value="expense">Expenses Only</option>
                <option value="income">Income Only</option>
                <option value="transfer">Transfers Only</option>
              </Select>
            </div>

            {/* Account Filter */}
            <div>
              <Select value={accountId} onChange={(e) => setAccountId(e.target.value)}>
                <option value="">All Accounts</option>
                {accounts.map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.name}
                  </option>
                ))}
              </Select>
            </div>

            {/* Category Filter */}
            <div>
              <Select value={categoryId} onChange={(e) => setCategoryId(e.target.value)}>
                <option value="">All Categories</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </Select>
            </div>

            {/* Date Range Start */}
            <div>
              <Input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                placeholder="From Date"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Transactions Table Card */}
      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-border bg-muted/40 font-semibold text-muted-foreground uppercase tracking-wider text-[11px]">
                  <th className="py-3 px-4">Date</th>
                  <th className="py-3 px-4">Description</th>
                  <th className="py-3 px-4">Category</th>
                  <th className="py-3 px-4">Account</th>
                  <th className="py-3 px-4 text-right">Amount</th>
                  <th className="py-3 px-4 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {loading ? (
                  <tr>
                    <td colSpan={6} className="p-6 text-center">
                      <div className="space-y-2">
                        {[1, 2, 3, 4, 5].map((n) => (
                          <Skeleton key={n} className="h-10 w-full" />
                        ))}
                      </div>
                    </td>
                  </tr>
                ) : transactions.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="p-12 text-center text-muted-foreground">
                      <div className="max-w-xs mx-auto space-y-2">
                        <Filter className="h-8 w-8 mx-auto text-muted-foreground opacity-50" />
                        <p className="font-semibold text-foreground text-sm">No transactions found</p>
                        <p className="text-xs">
                          Try adjusting your search terms or filters to find what you&apos;re looking for.
                        </p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  transactions.map((tx) => {
                    const isExpense = tx.type === "expense";
                    const isIncome = tx.type === "income";
                    return (
                      <tr key={tx.id} className="hover:bg-muted/30 transition-colors">
                        <td className="py-3.5 px-4 font-medium text-foreground whitespace-nowrap">
                          {formatDate(tx.date)}
                        </td>
                        <td className="py-3.5 px-4 max-w-xs truncate">
                          <div className="flex items-center gap-2">
                            <span
                              className={`p-1 rounded-md ${
                                isExpense
                                  ? "bg-red-500/10 text-red-600"
                                  : isIncome
                                  ? "bg-emerald-500/10 text-emerald-600"
                                  : "bg-blue-500/10 text-blue-600"
                              }`}
                            >
                              {isExpense ? (
                                <ArrowDownRight className="h-3 w-3" />
                              ) : isIncome ? (
                                <ArrowUpRight className="h-3 w-3" />
                              ) : (
                                <ArrowLeftRight className="h-3 w-3" />
                              )}
                            </span>
                            <div>
                              <p className="font-semibold text-foreground text-sm truncate">{tx.title}</p>
                              {tx.description && (
                                <p className="text-[11px] text-muted-foreground truncate">
                                  {tx.description}
                                </p>
                              )}
                            </div>
                          </div>
                        </td>
                        <td className="py-3.5 px-4 whitespace-nowrap">
                          {tx.category ? (
                            <Badge variant="outline" className="font-normal">
                              {tx.category.name}
                            </Badge>
                          ) : (
                            <span className="text-muted-foreground text-[11px]">Uncategorized</span>
                          )}
                        </td>
                        <td className="py-3.5 px-4 whitespace-nowrap">
                          <span className="font-medium text-foreground">{tx.account?.name || "N/A"}</span>
                          {tx.to_account && (
                            <span className="text-muted-foreground text-[11px]">
                              {" "}
                              → {tx.to_account.name}
                            </span>
                          )}
                        </td>
                        <td className="py-3.5 px-4 text-right whitespace-nowrap font-bold text-sm">
                          <span
                            className={
                              isExpense
                                ? "text-red-600 dark:text-red-400"
                                : isIncome
                                ? "text-emerald-600 dark:text-emerald-400"
                                : "text-blue-600 dark:text-blue-400"
                            }
                          >
                            {isExpense ? "-" : isIncome ? "+" : ""}
                            {formatCurrency(tx.amount)}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 text-center whitespace-nowrap">
                          <div className="flex items-center justify-center gap-1">
                            <button
                              onClick={() => openEditModal(tx)}
                              className="p-1.5 rounded-md hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
                              title="Edit transaction"
                            >
                              <Edit className="h-3.5 w-3.5" />
                            </button>
                            <button
                              onClick={() => handleDelete(tx.id)}
                              className="p-1.5 rounded-md hover:bg-red-500/10 text-muted-foreground hover:text-red-600 transition-colors"
                              title="Delete transaction"
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

          {/* Pagination Controls */}
          <div className="p-4 border-t border-border flex items-center justify-between text-xs text-muted-foreground">
            <div>
              Showing {transactions.length} of {pagination.totalItems} transactions
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                disabled={pagination.page <= 1}
                onClick={() => {
                  const nextP = pagination.page - 1;
                  setPagination((p) => ({ ...p, page: nextP }));
                  loadTransactions(nextP);
                }}
              >
                <ChevronLeft className="h-3.5 w-3.5 mr-1" /> Previous
              </Button>
              <span className="font-medium text-foreground px-2">
                Page {pagination.page} of {pagination.totalPages || 1}
              </span>
              <Button
                variant="outline"
                size="sm"
                disabled={pagination.page >= pagination.totalPages}
                onClick={() => {
                  const nextP = pagination.page + 1;
                  setPagination((p) => ({ ...p, page: nextP }));
                  loadTransactions(nextP);
                }}
              >
                Next <ChevronRight className="h-3.5 w-3.5 ml-1" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Edit Transaction Modal */}
      {editItem && (
        <Dialog open={!!editItem} onOpenChange={() => setEditItem(null)}>
          <DialogContent onClose={() => setEditItem(null)}>
            <DialogHeader>
              <DialogTitle>Edit Transaction</DialogTitle>
              <DialogDescription>
                Updates will adjust account balance automatically.
              </DialogDescription>
            </DialogHeader>

            <form onSubmit={handleUpdate} className="space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-medium text-muted-foreground">Title</label>
                <Input
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-medium text-muted-foreground">Amount (₹)</label>
                  <Input
                    type="number"
                    step="0.01"
                    value={editAmount}
                    onChange={(e) => setEditAmount(e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-medium text-muted-foreground">Date</label>
                  <Input
                    type="date"
                    value={editDate}
                    onChange={(e) => setEditDate(e.target.value)}
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-medium text-muted-foreground">Account</label>
                  <Select
                    value={editAccountId}
                    onChange={(e) => setEditAccountId(e.target.value)}
                    required
                  >
                    {accounts.map((a) => (
                      <option key={a.id} value={a.id}>
                        {a.name}
                      </option>
                    ))}
                  </Select>
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-medium text-muted-foreground">Category</label>
                  <Select
                    value={editCategoryId}
                    onChange={(e) => setEditCategoryId(e.target.value)}
                  >
                    <option value="">Uncategorized</option>
                    {categories.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </Select>
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-medium text-muted-foreground">Payment Method</label>
                <Input
                  value={editPaymentMethod}
                  onChange={(e) => setEditPaymentMethod(e.target.value)}
                  placeholder="e.g. UPI, Debit Card, Net Banking"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-medium text-muted-foreground">Notes</label>
                <Input
                  value={editNotes}
                  onChange={(e) => setEditNotes(e.target.value)}
                  placeholder="Notes..."
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setEditItem(null)}
                  disabled={editLoading}
                >
                  Cancel
                </Button>
                <Button type="submit" isLoading={editLoading}>
                  Save Changes
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      )}

      {/* Global Quick Add */}
      <QuickAddModal
        open={quickAddOpen}
        onOpenChange={setQuickAddOpen}
        onSuccess={() => loadTransactions(1)}
      />
    </div>
  );
}
