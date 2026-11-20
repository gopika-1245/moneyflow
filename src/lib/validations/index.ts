import { z } from "zod";

// Authentication Schemas
export const registerSchema = z
  .object({
    fullName: z.string().min(2, "Full name must be at least 2 characters").max(100),
    email: z.string().email("Invalid email address"),
    password: z.string().min(8, "Password must be at least 8 characters"),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

export const loginSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(1, "Password is required"),
});

export const forgotPasswordSchema = z.object({
  email: z.string().email("Invalid email address"),
});

export const resetPasswordSchema = z
  .object({
    password: z.string().min(8, "Password must be at least 8 characters"),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

// Account Schemas
export const accountSchema = z.object({
  name: z.string().min(1, "Account name is required").max(100),
  type: z.enum(["cash", "savings", "current", "credit_card", "wallet", "other"]),
  openingBalance: z.number().default(0),
  currency: z.string().min(3).max(10).default("INR"),
  institutionName: z.string().max(100).optional().nullable(),
  description: z.string().max(500).optional().nullable(),
});

export const transferSchema = z
  .object({
    fromAccountId: z.string().uuid("Invalid source account"),
    toAccountId: z.string().uuid("Invalid destination account"),
    amount: z.number().positive("Transfer amount must be greater than 0"),
    date: z.string().min(1, "Transfer date is required"),
    notes: z.string().max(500).optional().nullable(),
  })
  .refine((data) => data.fromAccountId !== data.toAccountId, {
    message: "Source and destination accounts must be different",
    path: ["toAccountId"],
  });

// Transaction Schemas
export const transactionSchema = z.object({
  title: z.string().min(1, "Title is required").max(150),
  description: z.string().max(500).optional().nullable(),
  amount: z.number().positive("Amount must be greater than 0"),
  type: z.enum(["income", "expense", "transfer"]),
  categoryId: z.string().uuid("Invalid category").optional().nullable(),
  accountId: z.string().uuid("Invalid account"),
  toAccountId: z.string().uuid("Invalid destination account").optional().nullable(),
  date: z.string().min(1, "Date is required"),
  paymentMethod: z.string().max(50).optional().nullable(),
  notes: z.string().max(1000).optional().nullable(),
});

export const transactionFilterSchema = z.object({
  type: z.enum(["income", "expense", "transfer"]).optional(),
  categoryId: z.string().uuid().optional(),
  accountId: z.string().uuid().optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  minAmount: z.number().optional(),
  maxAmount: z.number().optional(),
  search: z.string().optional(),
  page: z.number().int().positive().default(1),
  limit: z.number().int().positive().max(100).default(20),
  sortBy: z.enum(["date", "amount", "title"]).default("date"),
  sortOrder: z.enum(["asc", "desc"]).default("desc"),
});

// Budget Schemas
export const budgetSchema = z.object({
  categoryId: z.string().uuid("Invalid category"),
  amount: z.number().positive("Budget limit must be greater than 0"),
  month: z.number().int().min(1).max(12),
  year: z.number().int().min(2000).max(2100),
});

// Savings Goal Schemas
export const savingsGoalSchema = z.object({
  name: z.string().min(1, "Goal name is required").max(150),
  description: z.string().max(500).optional().nullable(),
  targetAmount: z.number().positive("Target amount must be greater than 0"),
  currentAmount: z.number().min(0).default(0),
  targetDate: z.string().optional().nullable(),
  status: z.enum(["active", "completed", "cancelled"]).default("active"),
});

export const goalContributionSchema = z.object({
  amount: z.number().refine((val) => val !== 0, "Contribution amount cannot be zero"),
  date: z.string().min(1, "Date is required"),
  notes: z.string().max(500).optional().nullable(),
});

// Recurring Transaction Schemas
export const recurringTransactionSchema = z.object({
  title: z.string().min(1, "Title is required").max(150),
  amount: z.number().positive("Amount must be greater than 0"),
  type: z.enum(["income", "expense", "transfer"]),
  categoryId: z.string().uuid().optional().nullable(),
  accountId: z.string().uuid("Invalid account"),
  toAccountId: z.string().uuid().optional().nullable(),
  frequency: z.enum(["daily", "weekly", "monthly", "quarterly", "yearly"]),
  startDate: z.string().min(1, "Start date is required"),
  endDate: z.string().optional().nullable(),
  notes: z.string().max(500).optional().nullable(),
  isActive: z.boolean().default(true),
});

// Reminder Schemas
export const reminderSchema = z.object({
  title: z.string().min(1, "Title is required").max(150),
  description: z.string().max(500).optional().nullable(),
  dueDate: z.string().min(1, "Due date is required"),
  amount: z.number().min(0).optional().nullable(),
  categoryId: z.string().uuid().optional().nullable(),
  recurrence: z.enum(["none", "daily", "weekly", "monthly", "quarterly", "yearly"]).default("none"),
  notificationPreference: z.enum(["in_app", "email", "both"]).default("in_app"),
});

// Category Schemas
export const categorySchema = z.object({
  name: z.string().min(1, "Category name is required").max(50),
  type: z.enum(["income", "expense"]),
  icon: z.string().min(1).default("Tag"),
  color: z.string().min(1).default("#10b981"),
});

// Preferences Schema
export const preferencesSchema = z.object({
  defaultCurrency: z.string().min(3).max(10).default("INR"),
  dateFormat: z.string().min(3).max(20).default("dd/MM/yyyy"),
  numberFormat: z.string().min(3).max(20).default("en-IN"),
  theme: z.enum(["light", "dark", "system"]).default("system"),
  budgetAlerts: z.boolean().default(true),
  recurringAlerts: z.boolean().default(true),
  reminderAlerts: z.boolean().default(true),
});
