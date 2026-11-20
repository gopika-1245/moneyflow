import * as React from "react";
import { cn } from "@/lib/utils";

export interface BadgeProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: "default" | "secondary" | "destructive" | "outline" | "success" | "warning";
}

function Badge({ className, variant = "default", ...props }: BadgeProps) {
  const variants = {
    default: "border-transparent bg-emerald-600 text-white shadow hover:bg-emerald-700",
    secondary: "border-transparent bg-secondary text-secondary-foreground hover:bg-secondary/80",
    destructive: "border-transparent bg-red-500/10 text-red-600 border border-red-500/20",
    outline: "text-foreground border border-border",
    success: "border-emerald-500/20 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-medium",
    warning: "border-amber-500/20 bg-amber-500/10 text-amber-600 dark:text-amber-400 font-medium",
  };

  return (
    <div
      className={cn(
        "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
        variants[variant],
        className
      )}
      {...props}
    />
  );
}

export { Badge };
