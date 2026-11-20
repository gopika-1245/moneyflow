import { AccountItem, TransactionItem, FrequencyType } from "@/types/finance";
import { addDays, addWeeks, addMonths, addYears, isBefore, isEqual, startOfDay, parseISO, format } from "date-fns";

/**
 * Calculates total financial balances across user accounts.
 * Credit cards are treated as liabilities (positive debt reduces net balance, or negative balance reduces assets).
 */
export function calculateAccountBalances(accounts: AccountItem[]) {
  let totalAssets = 0;
  let totalLiabilities = 0;

  for (const acc of accounts) {
    if (acc.is_archived) continue;

    const bal = Number(acc.current_balance) || 0;
    if (acc.type === "credit_card") {
      // Convention: In fintech, credit card balance represents current owed liability.
      // If balance is positive, user owes that money (liability).
      // If negative, it is an overpayment/credit.
      if (bal > 0) {
        totalLiabilities += bal;
      } else {
        totalAssets += Math.abs(bal);
      }
    } else {
      // Standard asset accounts (cash, savings, current, wallet, etc.)
      if (bal >= 0) {
        totalAssets += bal;
      } else {
        totalLiabilities += Math.abs(bal);
      }
    }
  }

  const netBalance = totalAssets - totalLiabilities;

  return {
    totalBalance: netBalance,
    totalAssets,
    totalLiabilities,
  };
}

/**
 * Calculates income, expense, and savings metrics from qualifying transactions.
 * STRICT RULE: Transfers are excluded from income and expenses!
 */
export function calculateCashFlowMetrics(transactions: TransactionItem[]) {
  let totalIncome = 0;
  let totalExpenses = 0;

  for (const t of transactions) {
    const amt = Number(t.amount) || 0;
    if (t.type === "income") {
      totalIncome += amt;
    } else if (t.type === "expense") {
      totalExpenses += amt;
    }
    // Transfers are ignored for cash flow
  }

  const netSavings = totalIncome - totalExpenses;
  const savingsRate = totalIncome > 0 ? (netSavings / totalIncome) * 100 : 0;

  return {
    totalIncome: Number(totalIncome.toFixed(2)),
    totalExpenses: Number(totalExpenses.toFixed(2)),
    netSavings: Number(netSavings.toFixed(2)),
    savingsRate: Number(Math.max(-100, Math.min(100, savingsRate)).toFixed(1)),
  };
}

/**
 * Calculates budget utilization and alert thresholds
 * Status: 'healthy' (< 80%), 'warning' (80% - 99.9%), 'exceeded' (>= 100%)
 */
export function calculateBudgetUtilization(budgetAmount: number, spentAmount: number) {
  const budget = Math.max(0, Number(budgetAmount) || 0);
  const spent = Math.max(0, Number(spentAmount) || 0);
  const remaining = Math.max(0, budget - spent);
  const percentage = budget > 0 ? (spent / budget) * 100 : 0;

  let status: "healthy" | "warning" | "exceeded" = "healthy";
  if (percentage >= 100) {
    status = "exceeded";
  } else if (percentage >= 80) {
    status = "warning";
  }

  return {
    budget,
    spent,
    remaining: Number(remaining.toFixed(2)),
    percentage: Number(percentage.toFixed(1)),
    status,
  };
}

/**
 * Calculates savings goal completion progress
 */
export function calculateSavingsProgress(targetAmount: number, currentAmount: number) {
  const target = Math.max(0.01, Number(targetAmount) || 0);
  const current = Math.max(0, Number(currentAmount) || 0);
  const remaining = Math.max(0, target - current);
  const percentage = Math.min(100, (current / target) * 100);

  return {
    target,
    current,
    remainingAmount: Number(remaining.toFixed(2)),
    progressPercentage: Number(percentage.toFixed(1)),
    isCompleted: current >= target,
  };
}

/**
 * Calculates next date for recurring frequency
 */
export function calculateNextOccurrence(startDate: Date | string, frequency: FrequencyType): Date {
  const base = typeof startDate === "string" ? parseISO(startDate) : startDate;

  switch (frequency) {
    case "daily":
      return addDays(base, 1);
    case "weekly":
      return addWeeks(base, 1);
    case "monthly":
      return addMonths(base, 1);
    case "quarterly":
      return addMonths(base, 3);
    case "yearly":
      return addYears(base, 1);
    default:
      return addMonths(base, 1);
  }
}

/**
 * Idempotently computes all occurrences that fell between nextOccurrence and upToDate
 * (Catch-up policy for missed occurrences when cron runs)
 */
export function getCatchUpOccurrences(
  nextOccurrence: string,
  frequency: FrequencyType,
  endDate: string | null | undefined,
  upToDate: Date = new Date()
): string[] {
  const occurrences: string[] = [];
  const limitDate = startOfDay(upToDate);
  const endLimit = endDate ? startOfDay(parseISO(endDate)) : null;

  let current = startOfDay(parseISO(nextOccurrence));

  // Safeguard against infinite loop: max 365 iterations
  let iterations = 0;
  while ((isBefore(current, limitDate) || isEqual(current, limitDate)) && iterations < 365) {
    if (endLimit && isBefore(endLimit, current)) {
      break;
    }
    occurrences.push(format(current, "yyyy-MM-dd"));
    current = startOfDay(calculateNextOccurrence(current, frequency));
    iterations++;
  }

  return occurrences;
}
