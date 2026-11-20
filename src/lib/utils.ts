import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Format monetary amount with currency code and locale
 * Supports INR with proper Indian numbering system (lakhs/crores)
 */
export function formatCurrency(
  amount: number | string | null | undefined,
  currency = "INR",
  locale?: string
): string {
  const numericAmount = Number(amount) || 0;

  // Determine appropriate locale if not provided
  let determinedLocale = locale;
  if (!determinedLocale) {
    if (currency === "INR") determinedLocale = "en-IN";
    else if (currency === "USD") determinedLocale = "en-US";
    else if (currency === "EUR") determinedLocale = "de-DE";
    else if (currency === "GBP") determinedLocale = "en-GB";
    else determinedLocale = "en-US";
  }

  try {
    return new Intl.NumberFormat(determinedLocale, {
      style: "currency",
      currency: currency,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(numericAmount);
  } catch {
    return `${currency} ${numericAmount.toFixed(2)}`;
  }
}

/**
 * Formats a date string safely into a readable format
 */
export function formatDate(
  dateInput: string | Date | null | undefined,
  options?: Intl.DateTimeFormatOptions
): string {
  if (!dateInput) return "N/A";
  try {
    const d = typeof dateInput === "string" ? new Date(dateInput) : dateInput;
    if (isNaN(d.getTime())) return "Invalid Date";
    return new Intl.DateTimeFormat("en-IN", {
      day: "numeric",
      month: "short",
      year: "numeric",
      ...options,
    }).format(d);
  } catch {
    return String(dateInput);
  }
}

/**
 * Sanitizes strings for CSV export to prevent spreadsheet formula injection attacks (CSV Injection / CWE-1236)
 */
export function sanitizeCsvField(value: unknown): string {
  if (value === null || value === undefined) return "";
  let str = String(value);

  // If the field starts with risky formula triggers, prefix with a single quote
  if (/^[=+\-@\t\r]/.test(str)) {
    str = `'${str}`;
  }

  // Escape internal double quotes
  if (str.includes('"') || str.includes(",") || str.includes("\n") || str.includes("\r")) {
    str = `"${str.replace(/"/g, '""')}"`;
  }

  return str;
}
