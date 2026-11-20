"use client";

import * as React from "react";
import { Bell, Check, Clock, AlertTriangle, Repeat, ExternalLink } from "lucide-react";
import Link from "next/link";
import { NotificationItem } from "@/types/finance";
import { formatDate } from "@/lib/utils";

export function NotificationsPopover() {
  const [open, setOpen] = React.useState(false);
  const [notifications, setNotifications] = React.useState<NotificationItem[]>([]);
  const [unreadCount, setUnreadCount] = React.useState(0);
  const dropdownRef = React.useRef<HTMLDivElement>(null);

  const fetchNotifications = React.useCallback(async () => {
    try {
      const res = await fetch("/api/notifications");
      const json = await res.json();
      if (json.success && json.data) {
        setNotifications(json.data.notifications || []);
        setUnreadCount(json.data.unreadCount || 0);
      }
    } catch {
      // Ignore network errors on polling
    }
  }, []);

  React.useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 60000); // refresh every minute
    return () => clearInterval(interval);
  }, [fetchNotifications]);

  React.useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    };
    if (open) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [open]);

  const handleMarkAllRead = async () => {
    try {
      await fetch("/api/notifications", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ markAllRead: true }),
      });
      setUnreadCount(0);
      setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
    } catch {}
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setOpen(!open)}
        className="relative p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
        title="Notifications"
      >
        <Bell className="h-4 w-4" />
        {unreadCount > 0 && (
          <span className="absolute top-1.5 right-1.5 flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-600"></span>
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 mt-2 w-80 sm:w-96 rounded-xl border border-border bg-card shadow-xl z-50 text-card-foreground animate-in fade-in zoom-in-95 duration-100 overflow-hidden">
          <div className="flex items-center justify-between p-4 border-b border-border bg-muted/20">
            <div className="flex items-center gap-2">
              <span className="font-semibold text-sm">Notifications</span>
              {unreadCount > 0 && (
                <span className="bg-emerald-500/10 text-emerald-600 text-xs px-2 py-0.5 rounded-full font-bold">
                  {unreadCount} new
                </span>
              )}
            </div>
            {unreadCount > 0 && (
              <button
                onClick={handleMarkAllRead}
                className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1 transition-colors"
              >
                <Check className="h-3 w-3" /> Mark all read
              </button>
            )}
          </div>

          <div className="max-h-80 overflow-y-auto divide-y divide-border">
            {notifications.length === 0 ? (
              <div className="p-8 text-center text-xs text-muted-foreground">
                No notifications right now. Everything is running smoothly!
              </div>
            ) : (
              notifications.map((n) => (
                <div
                  key={n.id}
                  className={`p-3 text-xs transition-colors hover:bg-muted/40 ${
                    !n.is_read ? "bg-emerald-500/5 font-medium" : ""
                  }`}
                >
                  <div className="flex items-start gap-2.5">
                    <div className="p-1.5 rounded-md bg-muted text-foreground mt-0.5">
                      {n.type === "reminder" ? (
                        <Clock className="h-3.5 w-3.5 text-amber-500" />
                      ) : n.type === "budget_alert" ? (
                        <AlertTriangle className="h-3.5 w-3.5 text-red-500" />
                      ) : (
                        <Repeat className="h-3.5 w-3.5 text-emerald-500" />
                      )}
                    </div>
                    <div className="flex-1 space-y-0.5">
                      <div className="flex items-center justify-between">
                        <span className="font-semibold text-foreground">{n.title}</span>
                        <span className="text-[10px] text-muted-foreground">
                          {formatDate(n.created_at)}
                        </span>
                      </div>
                      <p className="text-muted-foreground text-[11px] leading-relaxed">
                        {n.message}
                      </p>
                      {n.link && (
                        <Link
                          href={n.link}
                          onClick={() => setOpen(false)}
                          className="inline-flex items-center gap-1 text-[11px] text-emerald-600 hover:underline pt-1"
                        >
                          View details <ExternalLink className="h-2.5 w-2.5" />
                        </Link>
                      )}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
