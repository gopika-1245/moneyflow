export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type AccountType =
  | "cash"
  | "savings"
  | "current"
  | "credit_card"
  | "wallet"
  | "other";

export type TransactionType = "income" | "expense" | "transfer";

export type FrequencyType =
  | "daily"
  | "weekly"
  | "monthly"
  | "quarterly"
  | "yearly";

export type SavingsGoalStatus = "active" | "completed" | "cancelled";

export type ReminderStatus = "pending" | "completed" | "dismissed";

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          full_name: string | null;
          email: string | null;
          avatar_url: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          full_name?: string | null;
          email?: string | null;
          avatar_url?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          full_name?: string | null;
          email?: string | null;
          avatar_url?: string | null;
          updated_at?: string;
        };
      };
      user_preferences: {
        Row: {
          id: string;
          user_id: string;
          default_currency: string;
          date_format: string;
          number_format: string;
          theme: string;
          budget_alerts: boolean;
          recurring_alerts: boolean;
          reminder_alerts: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          default_currency?: string;
          date_format?: string;
          number_format?: string;
          theme?: string;
          budget_alerts?: boolean;
          recurring_alerts?: boolean;
          reminder_alerts?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          default_currency?: string;
          date_format?: string;
          number_format?: string;
          theme?: string;
          budget_alerts?: boolean;
          recurring_alerts?: boolean;
          reminder_alerts?: boolean;
          updated_at?: string;
        };
      };
      accounts: {
        Row: {
          id: string;
          user_id: string;
          name: string;
          type: AccountType;
          opening_balance: number;
          current_balance: number;
          currency: string;
          institution_name: string | null;
          description: string | null;
          is_archived: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          name: string;
          type: AccountType;
          opening_balance?: number;
          current_balance?: number;
          currency?: string;
          institution_name?: string | null;
          description?: string | null;
          is_archived?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          name?: string;
          type?: AccountType;
          opening_balance?: number;
          current_balance?: number;
          currency?: string;
          institution_name?: string | null;
          description?: string | null;
          is_archived?: boolean;
          updated_at?: string;
        };
      };
      categories: {
        Row: {
          id: string;
          user_id: string | null;
          name: string;
          type: "income" | "expense";
          icon: string;
          color: string;
          is_system: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id?: string | null;
          name: string;
          type: "income" | "expense";
          icon?: string;
          color?: string;
          is_system?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          name?: string;
          type?: "income" | "expense";
          icon?: string;
          color?: string;
          updated_at?: string;
        };
      };
      transactions: {
        Row: {
          id: string;
          user_id: string;
          title: string;
          description: string | null;
          amount: number;
          type: TransactionType;
          category_id: string | null;
          account_id: string;
          to_account_id: string | null;
          date: string;
          payment_method: string | null;
          notes: string | null;
          transfer_id: string | null;
          is_recurring: boolean;
          recurring_rule_id: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
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
          is_recurring?: boolean;
          recurring_rule_id?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          title?: string;
          description?: string | null;
          amount?: number;
          type?: TransactionType;
          category_id?: string | null;
          account_id?: string;
          to_account_id?: string | null;
          date?: string;
          payment_method?: string | null;
          notes?: string | null;
          updated_at?: string;
        };
      };
      budgets: {
        Row: {
          id: string;
          user_id: string;
          category_id: string;
          amount: number;
          month: number;
          year: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          category_id: string;
          amount: number;
          month: number;
          year: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          amount?: number;
          month?: number;
          year?: number;
          updated_at?: string;
        };
      };
      savings_goals: {
        Row: {
          id: string;
          user_id: string;
          name: string;
          description: string | null;
          target_amount: number;
          current_amount: number;
          target_date: string | null;
          status: SavingsGoalStatus;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          name: string;
          description?: string | null;
          target_amount: number;
          current_amount?: number;
          target_date?: string | null;
          status?: SavingsGoalStatus;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          name?: string;
          description?: string | null;
          target_amount?: number;
          current_amount?: number;
          target_date?: string | null;
          status?: SavingsGoalStatus;
          updated_at?: string;
        };
      };
      goal_contributions: {
        Row: {
          id: string;
          goal_id: string;
          user_id: string;
          amount: number;
          date: string;
          notes: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          goal_id: string;
          user_id: string;
          amount: number;
          date: string;
          notes?: string | null;
          created_at?: string;
        };
      };
      recurring_transactions: {
        Row: {
          id: string;
          user_id: string;
          title: string;
          amount: number;
          type: TransactionType;
          category_id: string | null;
          account_id: string;
          to_account_id: string | null;
          frequency: FrequencyType;
          start_date: string;
          end_date: string | null;
          next_occurrence: string;
          is_active: boolean;
          notes: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
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
          is_active?: boolean;
          notes?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          title?: string;
          amount?: number;
          type?: TransactionType;
          category_id?: string | null;
          account_id?: string;
          to_account_id?: string | null;
          frequency?: FrequencyType;
          start_date?: string;
          end_date?: string | null;
          next_occurrence?: string;
          is_active?: boolean;
          notes?: string | null;
          updated_at?: string;
        };
      };
      recurring_occurrences: {
        Row: {
          id: string;
          recurring_id: string;
          user_id: string;
          transaction_id: string | null;
          occurrence_date: string;
          occurrence_key: string;
          status: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          recurring_id: string;
          user_id: string;
          transaction_id?: string | null;
          occurrence_date: string;
          occurrence_key: string;
          status?: string;
          created_at?: string;
        };
      };
      reminders: {
        Row: {
          id: string;
          user_id: string;
          title: string;
          description: string | null;
          due_date: string;
          amount: number | null;
          category_id: string | null;
          recurrence: string;
          status: ReminderStatus;
          notification_preference: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          title: string;
          description?: string | null;
          due_date: string;
          amount?: number | null;
          category_id?: string | null;
          recurrence?: string;
          status?: ReminderStatus;
          notification_preference?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          title?: string;
          description?: string | null;
          due_date?: string;
          amount?: number | null;
          category_id?: string | null;
          recurrence?: string;
          status?: ReminderStatus;
          notification_preference?: string;
          updated_at?: string;
        };
      };
      notifications: {
        Row: {
          id: string;
          user_id: string;
          title: string;
          message: string;
          type: string;
          is_read: boolean;
          link: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          title: string;
          message: string;
          type?: string;
          is_read?: boolean;
          link?: string | null;
          created_at?: string;
        };
        Update: {
          is_read?: boolean;
        };
      };
      ai_conversations: {
        Row: {
          id: string;
          user_id: string;
          title: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          title?: string;
          created_at?: string;
          updated_at?: string;
        };
      };
      ai_messages: {
        Row: {
          id: string;
          conversation_id: string;
          user_id: string;
          role: "user" | "assistant" | "system";
          content: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          conversation_id: string;
          user_id: string;
          role: "user" | "assistant" | "system";
          content: string;
          created_at?: string;
        };
      };
    };
  };
}
