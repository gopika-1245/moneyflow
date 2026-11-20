import { describe, it, expect } from "vitest";
import {
  registerSchema,
  loginSchema,
  accountSchema,
  transferSchema,
  transactionSchema,
  transactionFilterSchema,
  budgetSchema,
  savingsGoalSchema,
  goalContributionSchema,
  recurringTransactionSchema,
  reminderSchema,
  categorySchema,
  preferencesSchema,
} from "@/lib/validations";

describe("Validation Schemas - Authentication", () => {
  it("validates valid registration data", () => {
    const validData = {
      fullName: "Priya Sharma",
      email: "priya@example.com",
      password: "StrongPassword123!",
      confirmPassword: "StrongPassword123!",
    };
    const result = registerSchema.safeParse(validData);
    expect(result.success).toBe(true);
  });

  it("rejects mismatched passwords during registration", () => {
    const invalidData = {
      fullName: "Priya Sharma",
      email: "priya@example.com",
      password: "StrongPassword123!",
      confirmPassword: "DifferentPassword123!",
    };
    const result = registerSchema.safeParse(invalidData);
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].message).toBe("Passwords do not match");
    }
  });

  it("rejects weak or short passwords under 8 characters", () => {
    const shortPassword = {
      fullName: "Priya Sharma",
      email: "priya@example.com",
      password: "short",
      confirmPassword: "short",
    };
    const result = registerSchema.safeParse(shortPassword);
    expect(result.success).toBe(false);
  });

  it("rejects invalid email formats", () => {
    const invalidEmail = {
      email: "not-an-email",
      password: "ValidPassword123!",
    };
    const result = loginSchema.safeParse(invalidEmail);
    expect(result.success).toBe(false);
  });
});

describe("Validation Schemas - Accounts & Transfers", () => {
  const validUUID1 = "a1b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d";
  const validUUID2 = "b2c3d4e5-f6a7-8b9c-0d1e-2f3a4b5c6d7e";

  it("validates accounts with proper types", () => {
    const account = {
      name: "HDFC Salary Account",
      type: "savings",
      openingBalance: 25000,
      currency: "INR",
    };
    const result = accountSchema.safeParse(account);
    expect(result.success).toBe(true);
  });

  it("rejects invalid account types", () => {
    const invalidAccount = {
      name: "HDFC Salary Account",
      type: "crypto_vault", // not in enum
      openingBalance: 25000,
      currency: "INR",
    };
    const result = accountSchema.safeParse(invalidAccount);
    expect(result.success).toBe(false);
  });

  it("validates inter-account transfers", () => {
    const validTransfer = {
      fromAccountId: validUUID1,
      toAccountId: validUUID2,
      amount: 5000,
      date: "2024-05-15",
      notes: "Monthly savings transfer",
    };
    const result = transferSchema.safeParse(validTransfer);
    expect(result.success).toBe(true);
  });

  it("strictly prevents transfer to the same account", () => {
    const sameAccountTransfer = {
      fromAccountId: validUUID1,
      toAccountId: validUUID1, // identical
      amount: 5000,
      date: "2024-05-15",
    };
    const result = transferSchema.safeParse(sameAccountTransfer);
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].message).toBe("Source and destination accounts must be different");
    }
  });

  it("rejects zero or negative transfer amounts", () => {
    const zeroTransfer = {
      fromAccountId: validUUID1,
      toAccountId: validUUID2,
      amount: 0,
      date: "2024-05-15",
    };
    expect(transferSchema.safeParse(zeroTransfer).success).toBe(false);

    const negativeTransfer = {
      fromAccountId: validUUID1,
      toAccountId: validUUID2,
      amount: -500,
      date: "2024-05-15",
    };
    expect(transferSchema.safeParse(negativeTransfer).success).toBe(false);
  });
});

describe("Validation Schemas - Transactions & Filters", () => {
  const validUUID = "a1b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d";

  it("validates transaction creation", () => {
    const tx = {
      title: "Grocery Shopping",
      amount: 3250.75,
      type: "expense",
      categoryId: validUUID,
      accountId: validUUID,
      date: "2024-05-10",
      paymentMethod: "UPI",
    };
    const result = transactionSchema.safeParse(tx);
    expect(result.success).toBe(true);
  });

  it("rejects transaction with invalid amount", () => {
    const tx = {
      title: "Zero transaction",
      amount: 0,
      type: "expense",
      accountId: validUUID,
      date: "2024-05-10",
    };
    expect(transactionSchema.safeParse(tx).success).toBe(false);
  });

  it("applies default pagination and sorting to transaction filters", () => {
    const filter = {};
    const parsed = transactionFilterSchema.parse(filter);
    expect(parsed.page).toBe(1);
    expect(parsed.limit).toBe(20);
    expect(parsed.sortBy).toBe("date");
    expect(parsed.sortOrder).toBe("desc");
  });
});

describe("Validation Schemas - Budgets & Goals", () => {
  const validUUID = "a1b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d";

  it("validates monthly budget with month range 1-12", () => {
    const budget = {
      categoryId: validUUID,
      amount: 15000,
      month: 6,
      year: 2024,
    };
    expect(budgetSchema.safeParse(budget).success).toBe(true);

    const invalidMonth = {
      categoryId: validUUID,
      amount: 15000,
      month: 13, // invalid
      year: 2024,
    };
    expect(budgetSchema.safeParse(invalidMonth).success).toBe(false);
  });

  it("validates savings goals and contributions", () => {
    const goal = {
      name: "Emergency Fund",
      targetAmount: 300000,
      currentAmount: 50000,
      targetDate: "2025-12-31",
      status: "active",
    };
    expect(savingsGoalSchema.safeParse(goal).success).toBe(true);

    const contribution = {
      amount: 10000,
      date: "2024-05-01",
      notes: "Monthly allocation",
    };
    expect(goalContributionSchema.safeParse(contribution).success).toBe(true);

    const zeroContribution = {
      amount: 0,
      date: "2024-05-01",
    };
    expect(goalContributionSchema.safeParse(zeroContribution).success).toBe(false);
  });
});

describe("Validation Schemas - Automation & Settings", () => {
  const validUUID = "a1b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d";

  it("validates recurring transaction frequencies", () => {
    const recurring = {
      title: "Monthly Rent",
      amount: 22000,
      type: "expense",
      accountId: validUUID,
      frequency: "monthly",
      startDate: "2024-01-01",
      isActive: true,
    };
    expect(recurringTransactionSchema.safeParse(recurring).success).toBe(true);
  });

  it("validates reminders with notification preferences", () => {
    const reminder = {
      title: "Electricity Bill Payment",
      dueDate: "2024-05-25",
      amount: 1850,
      recurrence: "monthly",
      notificationPreference: "both",
    };
    expect(reminderSchema.safeParse(reminder).success).toBe(true);
  });

  it("validates user preferences with defaults", () => {
    const defaults = preferencesSchema.parse({});
    expect(defaults.defaultCurrency).toBe("INR");
    expect(defaults.theme).toBe("system");
    expect(defaults.budgetAlerts).toBe(true);
  });
});
