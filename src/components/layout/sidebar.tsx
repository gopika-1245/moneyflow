"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  ArrowLeftRight,
  Wallet,
  PiggyBank,
  Target,
  BarChart3,
  Repeat,
  BellRing,
  Sparkles,
  FileSpreadsheet,
  Settings,
  X,
  CreditCard,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface SidebarProps {
  onCloseMobile?: () => void;
}

export const navigationItems = [
  { name: "Overview", href: "/dashboard", icon: LayoutDashboard },
  { name: "Transactions", href: "/transactions", icon: ArrowLeftRight },
  { name: "Accounts", href: "/accounts", icon: Wallet },
  { name: "Budgets", href: "/budgets", icon: PiggyBank },
  { name: "Savings Goals", href: "/goals", icon: Target },
  { name: "Analytics", href: "/analytics", icon: BarChart3 },
  { name: "Recurring", href: "/recurring", icon: Repeat },
  { name: "Reminders", href: "/reminders", icon: BellRing },
  { name: "AI Assistant", href: "/assistant", icon: Sparkles, badge: "AI" },
  { name: "Reports", href: "/reports", icon: FileSpreadsheet },
  { name: "Settings", href: "/settings", icon: Settings },
];

export function Sidebar({ onCloseMobile }: SidebarProps) {
  const pathname = usePathname();

  return (
    <aside className="flex flex-col h-full bg-card border-r border-border w-64 select-none">
      {/* Brand Header */}
      <div className="flex items-center justify-between h-16 px-6 border-b border-border">
        <Link
          href="/dashboard"
          className="flex items-center gap-2.5 font-bold text-xl tracking-tight text-foreground hover:opacity-90"
        >
          <div className="h-9 w-9 rounded-xl bg-emerald-600 flex items-center justify-center text-white shadow-md shadow-emerald-500/20">
            <span className="text-lg font-black leading-none">₹</span>
          </div>
          <div className="flex flex-col">
            <span className="text-lg leading-tight tracking-tight font-extrabold text-foreground">
              Money<span className="text-emerald-600 dark:text-emerald-500">Flow</span>
            </span>
            <span className="text-[10px] uppercase font-semibold text-muted-foreground tracking-wider -mt-0.5">
              Financial Suite
            </span>
          </div>
        </Link>
        {onCloseMobile && (
          <button
            onClick={onCloseMobile}
            className="md:hidden p-1.5 rounded-lg text-muted-foreground hover:bg-muted"
          >
            <X className="h-5 w-5" />
          </button>
        )}
      </div>

      {/* Nav list */}
      <div className="flex-1 overflow-y-auto px-3 py-4 space-y-1">
        <div className="px-3 pb-2 text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
          Finance Management
        </div>
        {navigationItems.map((item) => {
          const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`);
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={onCloseMobile}
              className={cn(
                "flex items-center justify-between px-3 py-2 rounded-lg text-sm font-medium transition-all group",
                isActive
                  ? "bg-emerald-600 text-white shadow-sm shadow-emerald-600/30 font-semibold"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted/70"
              )}
            >
              <div className="flex items-center gap-3">
                <Icon
                  className={cn(
                    "h-4 w-4 transition-colors",
                    isActive ? "text-white" : "text-muted-foreground group-hover:text-foreground"
                  )}
                />
                <span>{item.name}</span>
              </div>
              {item.badge && (
                <span
                  className={cn(
                    "text-[10px] font-bold px-1.5 py-0.5 rounded-full uppercase tracking-wider",
                    isActive
                      ? "bg-white/20 text-white"
                      : "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                  )}
                >
                  {item.badge}
                </span>
              )}
            </Link>
          );
        })}
      </div>

      {/* Footer info */}
      <div className="p-4 border-t border-border">
        <div className="flex items-center gap-3 p-2 rounded-lg bg-muted/40 border border-border/50 text-xs text-muted-foreground">
          <CreditCard className="h-4 w-4 text-emerald-600" />
          <div>
            <p className="font-medium text-foreground">Secure & Encrypted</p>
            <p className="text-[11px]">Protected by Supabase RLS</p>
          </div>
        </div>
      </div>
    </aside>
  );
}
