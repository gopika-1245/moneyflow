"use client";

import * as React from "react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/ui/card";
import { Button } from "@/ui/button";
import { Input } from "@/ui/input";
import { Select } from "@/ui/select";
import { Badge } from "@/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/ui/dialog";
import {
  User,
  Settings,
  Shield,
  Palette,
  Tags,
  Plus,
  Trash2,
  Lock,
  AlertTriangle,
  CheckCircle2,
} from "lucide-react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function SettingsPage() {
  const router = useRouter();
  const [profile, setProfile] = React.useState<any>(null);
  const [preferences, setPreferences] = React.useState<any>({
    default_currency: "INR",
    date_format: "dd/MM/yyyy",
    number_format: "en-IN",
    theme: "system",
    budget_alerts: true,
    recurring_alerts: true,
    reminder_alerts: true,
  });

  const [categories, setCategories] = React.useState<any[]>([]);
  const [loading, setLoading] = React.useState(true);

  // Profile Form State
  const [fullName, setFullName] = React.useState("");
  const [newPassword, setNewPassword] = React.useState("");
  const [confirmPassword, setConfirmPassword] = React.useState("");
  const [savingProfile, setSavingProfile] = React.useState(false);

  // Category Modal State
  const [catModalOpen, setCatModalOpen] = React.useState(false);
  const [catName, setCatName] = React.useState("");
  const [catType, setCatType] = React.useState<"expense" | "income">("expense");
  const [catColor, setCatColor] = React.useState("#10b981");
  const [catLoading, setCatLoading] = React.useState(false);

  // Delete Account Modal State
  const [deleteModalOpen, setDeleteModalOpen] = React.useState(false);
  const [deleteConfirmation, setDeleteConfirmation] = React.useState("");
  const [deleteLoading, setDeleteLoading] = React.useState(false);

  const loadSettings = React.useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/settings");
      const json = await res.json();
      if (json.success && json.data) {
        setProfile(json.data.user);
        setFullName(json.data.user.full_name || "");
        if (json.data.preferences) {
          setPreferences(json.data.preferences);
        }
      }

      const catRes = await fetch("/api/categories");
      const catJson = await catRes.json();
      if (catJson.success && catJson.data) {
        setCategories(catJson.data);
      }
    } catch {
      toast.error("Failed to load settings");
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    loadSettings();
  }, [loadSettings]);

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword && newPassword !== confirmPassword) {
      toast.error("New passwords do not match");
      return;
    }

    setSavingProfile(true);
    try {
      const payload: any = {
        fullName,
        preferences: {
          defaultCurrency: preferences.default_currency,
          dateFormat: preferences.date_format,
          numberFormat: preferences.number_format,
          theme: preferences.theme,
          budgetAlerts: preferences.budget_alerts,
          recurringAlerts: preferences.recurring_alerts,
          reminderAlerts: preferences.reminder_alerts,
        },
      };
      if (newPassword) payload.newPassword = newPassword;

      const res = await fetch("/api/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const json = await res.json();
      if (!res.ok || !json.success) throw new Error(json.error || "Failed to update profile");

      toast.success("Settings updated successfully!");
      setNewPassword("");
      setConfirmPassword("");
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Error updating settings");
    } finally {
      setSavingProfile(false);
    }
  };

  const handleCreateCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    setCatLoading(true);
    try {
      const res = await fetch("/api/categories", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: catName,
          type: catType,
          color: catColor,
          icon: "Tag",
        }),
      });
      const json = await res.json();
      if (!res.ok || !json.success) throw new Error(json.error || "Failed to add category");

      toast.success("Custom category created!");
      setCatModalOpen(false);
      setCatName("");
      loadSettings();
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Error creating category");
    } finally {
      setCatLoading(false);
    }
  };

  const handleDeleteCategory = async (id: string) => {
    try {
      const res = await fetch(`/api/categories/${id}`, { method: "DELETE" });
      const json = await res.json();
      if (!res.ok || !json.success) throw new Error(json.error || "Failed to delete");

      toast.success("Category deleted");
      loadSettings();
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Error deleting category");
    }
  };

  const handleDeleteAccount = async () => {
    if (deleteConfirmation !== "DELETE_MY_ACCOUNT") {
      toast.error("Please type DELETE_MY_ACCOUNT to confirm");
      return;
    }

    setDeleteLoading(true);
    try {
      const res = await fetch("/api/auth/delete-account", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ confirmation: deleteConfirmation }),
      });
      const json = await res.json();
      if (!res.ok || !json.success) throw new Error(json.error || "Account deletion failed");

      toast.success("Account permanently deleted");
      const supabase = createClient();
      await supabase.auth.signOut();
      router.push("/login");
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Error deleting account");
    } finally {
      setDeleteLoading(false);
    }
  };

  const customCategories = categories.filter((c) => !c.is_system);
  const systemCategories = categories.filter((c) => c.is_system);

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground">
          Settings & Preferences
        </h1>
        <p className="text-sm text-muted-foreground mt-0.5">
          Manage your personal profile, default currency, custom categories, and security.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Profile & Currency Preferences (2 Cols) */}
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <User className="h-5 w-5 text-emerald-600" />
                <CardTitle className="text-base font-bold">Profile & Account Info</CardTitle>
              </div>
              <CardDescription>Update your personal information and display name</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleUpdateProfile} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-muted-foreground">Full Name</label>
                    <Input
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      placeholder="Your name"
                      required
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-muted-foreground">Email</label>
                    <Input
                      value={profile?.email || ""}
                      disabled
                      className="opacity-75 cursor-not-allowed bg-muted"
                    />
                  </div>
                </div>

                {/* Preferences */}
                <div className="pt-4 border-t border-border">
                  <h3 className="text-sm font-bold text-foreground mb-3 flex items-center gap-2">
                    <Palette className="h-4 w-4 text-emerald-600" /> Regional & Financial Preferences
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div className="space-y-1">
                      <label className="text-xs font-medium text-muted-foreground">Default Currency</label>
                      <Select
                        value={preferences.default_currency}
                        onChange={(e) =>
                          setPreferences((p: any) => ({ ...p, default_currency: e.target.value }))
                        }
                      >
                        <option value="INR">INR (₹)</option>
                        <option value="USD">USD ($)</option>
                        <option value="EUR">EUR (€)</option>
                        <option value="GBP">GBP (£)</option>
                      </Select>
                    </div>

                    <div className="space-y-1">
                      <label className="text-xs font-medium text-muted-foreground">Date Format</label>
                      <Select
                        value={preferences.date_format}
                        onChange={(e) =>
                          setPreferences((p: any) => ({ ...p, date_format: e.target.value }))
                        }
                      >
                        <option value="dd/MM/yyyy">DD/MM/YYYY (31/12/2024)</option>
                        <option value="yyyy-MM-dd">YYYY-MM-DD (2024-12-31)</option>
                        <option value="MM/dd/yyyy">MM/DD/YYYY (12/31/2024)</option>
                      </Select>
                    </div>

                    <div className="space-y-1">
                      <label className="text-xs font-medium text-muted-foreground">Theme Preference</label>
                      <Select
                        value={preferences.theme}
                        onChange={(e) =>
                          setPreferences((p: any) => ({ ...p, theme: e.target.value }))
                        }
                      >
                        <option value="system">System Default</option>
                        <option value="light">Light Mode</option>
                        <option value="dark">Dark Mode</option>
                      </Select>
                    </div>
                  </div>
                </div>

                {/* Change Password */}
                <div className="pt-4 border-t border-border space-y-3">
                  <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
                    <Lock className="h-4 w-4 text-emerald-600" /> Security & Password
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="text-xs font-medium text-muted-foreground">
                        New Password (optional)
                      </label>
                      <Input
                        type="password"
                        placeholder="••••••••"
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        minLength={8}
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs font-medium text-muted-foreground">
                        Confirm New Password
                      </label>
                      <Input
                        type="password"
                        placeholder="••••••••"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        minLength={8}
                      />
                    </div>
                  </div>
                </div>

                <div className="pt-2 flex justify-end">
                  <Button type="submit" isLoading={savingProfile} className="font-semibold">
                    <CheckCircle2 className="h-4 w-4 mr-1.5" /> Save Changes
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>

          {/* Danger Zone: Account Deletion */}
          <Card className="border-red-500/30 bg-red-500/5">
            <CardHeader>
              <div className="flex items-center gap-2 text-red-600">
                <AlertTriangle className="h-5 w-5" />
                <CardTitle className="text-base font-bold">Danger Zone</CardTitle>
              </div>
              <CardDescription>
                Permanent account deletion and complete erasure of financial data.
              </CardDescription>
            </CardHeader>
            <CardContent className="flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold text-foreground">Delete MoneyFlow Account</p>
                <p className="text-[11px] text-muted-foreground">
                  Permanently deletes your account, transactions, and linked records.
                </p>
              </div>
              <Button
                variant="destructive"
                size="sm"
                onClick={() => setDeleteModalOpen(true)}
                className="text-xs font-semibold"
              >
                Delete Account
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Right Column: Custom Categories Manager (1 Col) */}
        <div>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-3">
              <div>
                <div className="flex items-center gap-2">
                  <Tags className="h-5 w-5 text-emerald-600" />
                  <CardTitle className="text-base font-bold">Custom Categories</CardTitle>
                </div>
                <CardDescription>Create your own tags & classifications</CardDescription>
              </div>
              <Button size="sm" onClick={() => setCatModalOpen(true)} className="text-xs">
                <Plus className="h-3.5 w-3.5 mr-1" /> Add
              </Button>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* User Custom Categories */}
              <div className="space-y-2">
                <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
                  Your Categories ({customCategories.length})
                </span>
                {customCategories.length === 0 ? (
                  <p className="text-xs text-muted-foreground italic p-2 border border-dashed rounded-lg text-center">
                    No custom categories added yet.
                  </p>
                ) : (
                  <div className="space-y-1.5">
                    {customCategories.map((c) => (
                      <div
                        key={c.id}
                        className="flex items-center justify-between p-2 rounded-lg border border-border bg-card text-xs hover:bg-muted/30 transition-colors"
                      >
                        <div className="flex items-center gap-2">
                          <span
                            className="w-3 h-3 rounded-full"
                            style={{ backgroundColor: c.color }}
                          />
                          <span className="font-semibold text-foreground">{c.name}</span>
                          <Badge variant="outline" className="text-[9px] uppercase">
                            {c.type}
                          </Badge>
                        </div>
                        <button
                          onClick={() => handleDeleteCategory(c.id)}
                          className="p-1 text-muted-foreground hover:text-red-600 rounded transition-colors"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* System Built-in Categories */}
              <div className="space-y-2 pt-2 border-t border-border">
                <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
                  System Categories ({systemCategories.length})
                </span>
                <div className="flex flex-wrap gap-1.5 max-h-48 overflow-y-auto pr-1">
                  {systemCategories.map((sc) => (
                    <Badge
                      key={sc.id}
                      variant="secondary"
                      className="text-[10px] py-1 px-2 font-medium"
                    >
                      <span
                        className="w-1.5 h-1.5 rounded-full mr-1.5 inline-block"
                        style={{ backgroundColor: sc.color }}
                      />
                      {sc.name}
                    </Badge>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Add Category Modal */}
      <Dialog open={catModalOpen} onOpenChange={setCatModalOpen}>
        <DialogContent onClose={() => setCatModalOpen(false)}>
          <DialogHeader>
            <DialogTitle>Add Custom Category</DialogTitle>
            <DialogDescription>
              Create a personalized category for tagging your transactions and budgets.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleCreateCategory} className="space-y-4">
            <div className="space-y-1">
              <label className="text-xs font-medium text-muted-foreground">Category Name</label>
              <Input
                placeholder="e.g. Pet Care, Gaming, Side Hustle"
                value={catName}
                onChange={(e) => setCatName(e.target.value)}
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-xs font-medium text-muted-foreground">Category Type</label>
                <Select value={catType} onChange={(e) => setCatType(e.target.value as any)}>
                  <option value="expense">Expense</option>
                  <option value="income">Income</option>
                </Select>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-medium text-muted-foreground">Color Badge</label>
                <div className="flex items-center gap-2">
                  <Input
                    type="color"
                    value={catColor}
                    onChange={(e) => setCatColor(e.target.value)}
                    className="w-14 h-9 p-1 cursor-pointer"
                  />
                  <Input
                    value={catColor}
                    onChange={(e) => setCatColor(e.target.value)}
                    className="flex-1 text-xs"
                  />
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setCatModalOpen(false)}
                disabled={catLoading}
              >
                Cancel
              </Button>
              <Button type="submit" isLoading={catLoading}>
                Create Category
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Account Modal */}
      <Dialog open={deleteModalOpen} onOpenChange={setDeleteModalOpen}>
        <DialogContent onClose={() => setDeleteModalOpen(false)}>
          <DialogHeader>
            <div className="flex items-center gap-2 text-red-600 mb-1">
              <AlertTriangle className="h-5 w-5" />
              <DialogTitle>Delete MoneyFlow Account</DialogTitle>
            </div>
            <DialogDescription>
              This action is permanent and irreversible. All your accounts, transactions, budgets, goals, and history will be completely erased.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-xs text-red-700 dark:text-red-300">
              To proceed, please type <strong>DELETE_MY_ACCOUNT</strong> in the box below.
            </div>

            <Input
              value={deleteConfirmation}
              onChange={(e) => setDeleteConfirmation(e.target.value)}
              placeholder="DELETE_MY_ACCOUNT"
              className="border-red-500 focus-visible:ring-red-500"
            />

            <div className="flex justify-end gap-2 pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setDeleteModalOpen(false)}
                disabled={deleteLoading}
              >
                Cancel
              </Button>
              <Button
                variant="destructive"
                onClick={handleDeleteAccount}
                disabled={deleteConfirmation !== "DELETE_MY_ACCOUNT"}
                isLoading={deleteLoading}
              >
                Permanently Delete Account
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
