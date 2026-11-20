import { AccountType, TransactionType, FrequencyType, SavingsGoalStatus, ReminderStatus } from "./database";

export type { AccountType, TransactionType, FrequencyType, SavingsGoalStatus, ReminderStatus };

export interface AccountItem {
  id: string;
  user_id: string;
  name: string;
  type: AccountType;
  opening_balance: number;
  current_balance: number;
  currency: string;
  institution_name?: string | null;
  description?: string | null;
  is_archived: boolean;
  created_at: string;
  updated_at: string;
}

export interface CategoryItem {
  id: string;
  user_id: string | null;
  name: string;
  type: "income" | "expense";
  icon: string;
  color: string;
  is_system: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface TransactionItem {
  id: string;
  user_id: string;
  title: string;
  description?: string | null;
  amount: number;
  type: TransactionType;
  category_id?: string | null;
  account_id: string;
  to_account_id?: string | null;
  date: string;
  payment_method?: string | null;
  notes?: string | null;
  transfer_id?: string | null;
  is_recurring: boolean;
  recurring_rule_id?: string | null;
  created_at: string;
  updated_at: string;
  category?: CategoryItem | null;
  account?: AccountItem | null;
  to_account?: AccountItem | null;
}

export interface BudgetItem {
  id: string;
  user_id: string;
  category_id: string;
  amount: number;
  spent: number;
  remaining: number;
  percentage: number;
  status: "healthy" | "warning" | "exceeded";
  month: number;
  year: number;
  category?: CategoryItem | null;
}

export interface SavingsGoalItem {
  id: string;
  user_id: string;
  name: string;
  description?: string | null;
  target_amount: number;
  current_amount: number;
  remaining_amount: number;
  progress_percentage: number;
  target_date?: string | null;
  status: SavingsGoalStatus;
  created_at: string;
  updated_at: string;
  contributions?: GoalContributionItem[];
}

export interface GoalContributionItem {
  id: string;
  goal_id: string;
  user_id: string;
  amount: number;
  date: string;
  notes?: string | null;
  created_at: string;
}

export interface RecurringTransactionItem {
  id: string;
  user_id: string;
  title: string;
  amount: number;
  type: TransactionType;
  category_id?: string | null;
  account_id: string;
  to_account_id?: string | null;
  frequency: FrequencyType;
  start_date: string;
  end_date?: string | null;
  next_occurrence: string;
  is_active: boolean;
  notes?: string | null;
  created_at: string;
  updated_at: string;
  category?: CategoryItem | null;
  account?: AccountItem | null;
}

export interface ReminderItem {
  id: string;
  user_id: string;
  title: string;
  description?: string | null;
  due_date: string;
  amount?: number | null;
  category_id?: string | null;
  recurrence: string;
  status: ReminderStatus;
  notification_preference: string;
  created_at: string;
  updated_at: string;
  category?: CategoryItem | null;
}

export interface NotificationItem {
  id: string;
  user_id: string;
  title: string;
  message: string;
  type: string;
  is_read: boolean;
  link?: string | null;
  created_at: string;
}

export interface DashboardSummary {
  totalBalance: number;
  totalAssets: number;
  totalLiabilities: number;
  monthlyIncome: number;
  monthlyExpenses: number;
  monthlySavings: number;
  savingsRate: number;
  netCashFlow: number;
  periodLabel: string;
}

export interface ChartDataPoint {
  date: string;
  income: number;
  expense: number;
  savings: number;
}

export interface CategoryBreakdown {
  category: string;
  amount: number;
  percentage: number;
  color: string;
  icon: string;
}

export interface AccountDistribution {
  name: string;
  balance: number;
  type: AccountType;
  percentage: number;
}
