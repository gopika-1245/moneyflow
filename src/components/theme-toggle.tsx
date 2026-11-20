"use client";

import { useTheme } from "./theme-provider";
import { Sun, Moon, Laptop } from "lucide-react";
import { Button } from "./ui/button";

export function ThemeToggle() {
  const { theme, setTheme } = useTheme();

  return (
    <div className="flex items-center rounded-lg border border-border p-0.5 bg-muted/40">
      <button
        onClick={() => setTheme("light")}
        className={`p-1.5 rounded-md transition-colors ${
          theme === "light"
            ? "bg-card text-foreground shadow-sm"
            : "text-muted-foreground hover:text-foreground"
        }`}
        title="Light theme"
      >
        <Sun className="h-4 w-4" />
      </button>
      <button
        onClick={() => setTheme("dark")}
        className={`p-1.5 rounded-md transition-colors ${
          theme === "dark"
            ? "bg-card text-foreground shadow-sm"
            : "text-muted-foreground hover:text-foreground"
        }`}
        title="Dark theme"
      >
        <Moon className="h-4 w-4" />
      </button>
      <button
        onClick={() => setTheme("system")}
        className={`p-1.5 rounded-md transition-colors ${
          theme === "system"
            ? "bg-card text-foreground shadow-sm"
            : "text-muted-foreground hover:text-foreground"
        }`}
        title="System theme"
      >
        <Laptop className="h-4 w-4" />
      </button>
    </div>
  );
}
