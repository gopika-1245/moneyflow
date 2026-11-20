"use client";

import * as React from "react";
import { Menu, Plus, User, LogOut, Settings } from "lucide-react";
import { Button } from "@/ui/button";
import { ThemeToggle } from "@/components/theme-toggle";
import { NotificationsPopover } from "./notifications-popover";
import { QuickAddModal } from "./quick-add-modal";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { toast } from "sonner";

interface TopbarProps {
  onOpenMobileMenu: () => void;
}

export function Topbar({ onOpenMobileMenu }: TopbarProps) {
  const router = useRouter();
  const [quickAddOpen, setQuickAddOpen] = React.useState(false);
  const [profileOpen, setProfileOpen] = React.useState(false);
  const [userEmail, setUserEmail] = React.useState<string>("user@moneyflow.app");
  const [userName, setUserName] = React.useState<string>("MoneyFlow User");
  const profileRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) {
        setUserEmail(user.email || "user@moneyflow.app");
        if (user.user_metadata?.full_name) {
          setUserName(user.user_metadata.full_name);
        }
      }
    });

    const handleClickOutside = (e: MouseEvent) => {
      if (profileRef.current && !profileRef.current.contains(e.target as Node)) {
        setProfileOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleLogout = async () => {
    try {
      const supabase = createClient();
      await supabase.auth.signOut();
      toast.success("Logged out successfully");
      router.push("/login");
      router.refresh();
    } catch {
      router.push("/login");
    }
  };

  return (
    <>
      <header className="h-16 border-b border-border bg-card/60 backdrop-blur-md sticky top-0 z-40 px-4 md:px-6 flex items-center justify-between">
        {/* Left side: Mobile menu toggle + Page title / breadcrumb */}
        <div className="flex items-center gap-3">
          <button
            onClick={onOpenMobileMenu}
            className="md:hidden p-2 rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
            title="Open navigation menu"
          >
            <Menu className="h-5 w-5" />
          </button>
          <div className="hidden sm:block text-xs font-medium text-muted-foreground">
            MoneyFlow Intelligence • Live Overview
          </div>
        </div>

        {/* Right side tools */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Quick Add Button */}
          <Button
            size="sm"
            onClick={() => setQuickAddOpen(true)}
            className="shadow-sm font-semibold flex items-center gap-1.5 text-xs sm:text-sm px-3 sm:px-4"
          >
            <Plus className="h-4 w-4" />
            <span className="hidden sm:inline">Add Transaction</span>
            <span className="sm:hidden">Add</span>
          </Button>

          {/* In-app Notifications */}
          <NotificationsPopover />

          {/* Theme Toggle */}
          <ThemeToggle />

          {/* Profile Menu Dropdown */}
          <div className="relative" ref={profileRef}>
            <button
              onClick={() => setProfileOpen(!profileOpen)}
              className="flex items-center gap-2 p-1.5 rounded-lg hover:bg-muted transition-colors text-left"
              title="Profile menu"
            >
              <div className="h-8 w-8 rounded-full bg-emerald-600/10 text-emerald-600 border border-emerald-500/20 flex items-center justify-center font-bold text-xs uppercase">
                {userName.slice(0, 2)}
              </div>
            </button>

            {profileOpen && (
              <div className="absolute right-0 mt-2 w-56 rounded-xl border border-border bg-card shadow-xl p-2 z-50 animate-in fade-in zoom-in-95 duration-100 text-xs">
                <div className="px-3 py-2 border-b border-border mb-1">
                  <p className="font-semibold text-foreground truncate">{userName}</p>
                  <p className="text-muted-foreground text-[11px] truncate">{userEmail}</p>
                </div>

                <Link
                  href="/settings"
                  onClick={() => setProfileOpen(false)}
                  className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-foreground hover:bg-muted transition-colors"
                >
                  <Settings className="h-4 w-4 text-muted-foreground" />
                  Account & Settings
                </Link>

                <button
                  onClick={handleLogout}
                  className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-red-600 hover:bg-red-500/10 transition-colors mt-1 font-medium"
                >
                  <LogOut className="h-4 w-4" />
                  Sign Out
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Global Quick Add Transaction Modal */}
      <QuickAddModal
        open={quickAddOpen}
        onOpenChange={setQuickAddOpen}
        onSuccess={() => {
          router.refresh();
        }}
      />
    </>
  );
}
