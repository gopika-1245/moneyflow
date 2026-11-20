import { describe, it, expect } from "vitest";
import {
  calculateAccountBalances,
  calculateCashFlowMetrics,
  calculateBudgetUtilization,
  calculateSavingsProgress,
  calculateNextOccurrence,
  getCatchUpOccurrences,
} from "@/lib/calculations/finance";
import { formatCurrency, sanitizeCsvField } from "@/lib/utils";
import { AccountItem, TransactionItem } from "@/types/finance";

describe("Financial Calculations", () => {
  it("correctly balances assets and credit card liabilities", () => {
    const accounts: AccountItem[] = [
      {
        id: "1",
        user_id: "u1",
        name: "Savings",
        type: "savings",
        opening_balance: 50000,
        current_balance: 75000,
        currency: "INR",
        is_archived: false,
        created_at: "",
        updated_at: "",
      },
      {
        id: "2",
        user_id: "u1",
        name: "Cash",
        type: "cash",
        opening_balance: 5000,
        current_balance: 5000,
        currency: "INR",
        is_archived: false,
        created_at: "",
        updated_at: "",
      },
      {
        id: "3",
        user_id: "u1",
        name: "Credit Card",
        type: "credit_card",
        opening_balance: 0,
        current_balance: 15000, // debt
        currency: "INR",
        is_archived: false,
        created_at: "",
        updated_at: "",
      },
      {
        id: "4",
        user_id: "u1",
        name: "Old Account",
        type: "savings",
        opening_balance: 1000,
        current_balance: 1000,
        currency: "INR",
        is_archived: true, // Archived should be excluded
        created_at: "",
        updated_at: "",
      },
    ];

    const result = calculateAccountBalances(accounts);
    expect(result.totalAssets).toBe(80000);
    expect(result.totalLiabilities).toBe(15000);
    expect(result.totalBalance).toBe(65000);
  });

  it("calculates cash flow metrics excluding transfers", () => {
    const txs: TransactionItem[] = [
      {
        id: "1",
        user_id: "u1",
        title: "Salary",
        amount: 100000,
        type: "income",
        account_id: "acc1",
        date: "2024-05-01",
        is_recurring: false,
        created_at: "",
        updated_at: "",
      },
      {
        id: "2",
        user_id: "u1",
        title: "Rent",
        amount: 25000,
        type: "expense",
        account_id: "acc1",
        date: "2024-05-02",
        is_recurring: false,
        created_at: "",
        updated_at: "",
      },
      {
        id: "3",
        user_id: "u1",
        title: "Transfer to Savings",
        amount: 50000,
        type: "transfer", // Transfer should not affect cash flow
        account_id: "acc1",
        to_account_id: "acc2",
        date: "2024-05-03",
        is_recurring: false,
        created_at: "",
        updated_at: "",
      },
    ];

    const metrics = calculateCashFlowMetrics(txs);
    expect(metrics.totalIncome).toBe(100000);
    expect(metrics.totalExpenses).toBe(25000);
    expect(metrics.netSavings).toBe(75000);
    expect(metrics.savingsRate).toBe(75);
  });

  it("correctly identifies budget utilization thresholds", () => {
    // Under 80% -> healthy
    const healthy = calculateBudgetUtilization(10000, 5000);
    expect(healthy.percentage).toBe(50);
    expect(healthy.remaining).toBe(5000);
    expect(healthy.status).toBe("healthy");

    // 80% to 99.9% -> warning
    const warning = calculateBudgetUtilization(10000, 8500);
    expect(warning.percentage).toBe(85);
    expect(warning.remaining).toBe(1500);
    expect(warning.status).toBe("warning");

    // 100%+ -> exceeded
    const exceeded = calculateBudgetUtilization(10000, 10500);
    expect(exceeded.percentage).toBe(105);
    expect(exceeded.remaining).toBe(0);
    expect(exceeded.status).toBe("exceeded");
  });

  it("calculates savings goal progress", () => {
    const progress = calculateSavingsProgress(100000, 45000);
    expect(progress.target).toBe(100000);
    expect(progress.current).toBe(45000);
    expect(progress.remainingAmount).toBe(55000);
    expect(progress.progressPercentage).toBe(45);
    expect(progress.isCompleted).toBe(false);

    const completed = calculateSavingsProgress(50000, 50000);
    expect(completed.progressPercentage).toBe(100);
    expect(completed.isCompleted).toBe(true);
  });

  it("computes next occurrence and catch-up dates accurately", () => {
    const base = new Date("2024-01-15T00:00:00Z");
    const nextDaily = calculateNextOccurrence(base, "daily");
    expect(nextDaily.getDate()).toBe(16);

    const nextMonthly = calculateNextOccurrence(base, "monthly");
    expect(nextMonthly.getMonth()).toBe(1); // February (0-indexed 1)

    // Catch up 3 days
    const dueDates = getCatchUpOccurrences("2024-01-01", "daily", null, new Date("2024-01-03T12:00:00Z"));
    expect(dueDates.length).toBe(3);
    expect(dueDates).toEqual(["2024-01-01", "2024-01-02", "2024-01-03"]);
  });

  it("formats Indian Rupee (INR) and other currencies with proper symbols", () => {
    const inr = formatCurrency(150000, "INR");
    expect(inr).toContain("1,50,000.00");
    expect(inr).toContain("₹");

    const usd = formatCurrency(1250.5, "USD");
    expect(usd).toContain("1,250.50");
    expect(usd).toContain("$");
  });

  it("sanitizes CSV fields against formula injection attacks", () => {
    expect(sanitizeCsvField("=SUM(A1:B1)")).toBe("'=SUM(A1:B1)");
    expect(sanitizeCsvField("+CMD|' /C calc'!A0")).toBe("'+CMD|' /C calc'!A0");
    expect(sanitizeCsvField("-2+3")).toBe("'-2+3");
    expect(sanitizeCsvField("@malicious")).toBe("'@malicious");
    expect(sanitizeCsvField("Normal Text")).toBe("Normal Text");
    expect(sanitizeCsvField('Text with "quotes"')).toBe('"Text with ""quotes"""');
  });
});
