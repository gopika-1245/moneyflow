-- MoneyFlow Complete Database Schema & Migrations
-- PostgreSQL / Supabase Compatible

-- 1. Enable UUID Extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. Profiles Table
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    full_name TEXT,
    email TEXT,
    avatar_url TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 3. User Preferences Table
CREATE TABLE IF NOT EXISTS public.user_preferences (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
    default_currency VARCHAR(10) NOT NULL DEFAULT 'INR',
    date_format VARCHAR(20) NOT NULL DEFAULT 'dd/MM/yyyy',
    number_format VARCHAR(20) NOT NULL DEFAULT 'en-IN',
    theme VARCHAR(10) NOT NULL DEFAULT 'system',
    budget_alerts BOOLEAN NOT NULL DEFAULT true,
    recurring_alerts BOOLEAN NOT NULL DEFAULT true,
    reminder_alerts BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 4. Accounts Table
CREATE TABLE IF NOT EXISTS public.accounts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    type VARCHAR(30) NOT NULL CHECK (type IN ('cash', 'savings', 'current', 'credit_card', 'wallet', 'other')),
    opening_balance NUMERIC(14,2) NOT NULL DEFAULT 0.00,
    current_balance NUMERIC(14,2) NOT NULL DEFAULT 0.00,
    currency VARCHAR(10) NOT NULL DEFAULT 'INR',
    institution_name TEXT,
    description TEXT,
    is_archived BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 5. Categories Table (system categories have user_id IS NULL)
CREATE TABLE IF NOT EXISTS public.categories (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    type VARCHAR(20) NOT NULL CHECK (type IN ('income', 'expense')),
    icon VARCHAR(50) NOT NULL DEFAULT 'Tag',
    color VARCHAR(50) NOT NULL DEFAULT '#10b981',
    is_system BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 6. Transactions Table
CREATE TABLE IF NOT EXISTS public.transactions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT,
    amount NUMERIC(14,2) NOT NULL CHECK (amount > 0),
    type VARCHAR(20) NOT NULL CHECK (type IN ('income', 'expense', 'transfer')),
    category_id UUID REFERENCES public.categories(id) ON DELETE SET NULL,
    account_id UUID NOT NULL REFERENCES public.accounts(id) ON DELETE CASCADE,
    to_account_id UUID REFERENCES public.accounts(id) ON DELETE SET NULL,
    date DATE NOT NULL,
    payment_method VARCHAR(50),
    notes TEXT,
    transfer_id UUID,
    is_recurring BOOLEAN NOT NULL DEFAULT false,
    recurring_rule_id UUID,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 7. Budgets Table
CREATE TABLE IF NOT EXISTS public.budgets (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    category_id UUID NOT NULL REFERENCES public.categories(id) ON DELETE CASCADE,
    amount NUMERIC(14,2) NOT NULL CHECK (amount > 0),
    month INTEGER NOT NULL CHECK (month >= 1 AND month <= 12),
    year INTEGER NOT NULL CHECK (year >= 2000 AND year <= 2100),
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    CONSTRAINT unique_user_category_month_year UNIQUE (user_id, category_id, month, year)
);

-- 8. Savings Goals Table
CREATE TABLE IF NOT EXISTS public.savings_goals (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    description TEXT,
    target_amount NUMERIC(14,2) NOT NULL CHECK (target_amount > 0),
    current_amount NUMERIC(14,2) NOT NULL DEFAULT 0.00 CHECK (current_amount >= 0),
    target_date DATE,
    status VARCHAR(20) NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'completed', 'cancelled')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 9. Goal Contributions Table
CREATE TABLE IF NOT EXISTS public.goal_contributions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    goal_id UUID NOT NULL REFERENCES public.savings_goals(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    amount NUMERIC(14,2) NOT NULL CHECK (amount != 0),
    date DATE NOT NULL,
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 10. Recurring Transactions Table
CREATE TABLE IF NOT EXISTS public.recurring_transactions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    amount NUMERIC(14,2) NOT NULL CHECK (amount > 0),
    type VARCHAR(20) NOT NULL CHECK (type IN ('income', 'expense', 'transfer')),
    category_id UUID REFERENCES public.categories(id) ON DELETE SET NULL,
    account_id UUID NOT NULL REFERENCES public.accounts(id) ON DELETE CASCADE,
    to_account_id UUID REFERENCES public.accounts(id) ON DELETE SET NULL,
    frequency VARCHAR(20) NOT NULL CHECK (frequency IN ('daily', 'weekly', 'monthly', 'quarterly', 'yearly')),
    start_date DATE NOT NULL,
    end_date DATE,
    next_occurrence DATE NOT NULL,
    is_active BOOLEAN NOT NULL DEFAULT true,
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 11. Recurring Occurrences Table (Idempotent processing)
CREATE TABLE IF NOT EXISTS public.recurring_occurrences (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    recurring_id UUID NOT NULL REFERENCES public.recurring_transactions(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    transaction_id UUID REFERENCES public.transactions(id) ON DELETE SET NULL,
    occurrence_date DATE NOT NULL,
    occurrence_key TEXT NOT NULL UNIQUE,
    status VARCHAR(20) NOT NULL DEFAULT 'processed',
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 12. Financial Reminders Table
CREATE TABLE IF NOT EXISTS public.reminders (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT,
    due_date DATE NOT NULL,
    amount NUMERIC(14,2) CHECK (amount IS NULL OR amount >= 0),
    category_id UUID REFERENCES public.categories(id) ON DELETE SET NULL,
    recurrence VARCHAR(20) NOT NULL DEFAULT 'none' CHECK (recurrence IN ('none', 'daily', 'weekly', 'monthly', 'quarterly', 'yearly')),
    status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'dismissed')),
    notification_preference VARCHAR(20) NOT NULL DEFAULT 'in_app',
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 13. Notifications Table
CREATE TABLE IF NOT EXISTS public.notifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    type VARCHAR(30) NOT NULL DEFAULT 'info',
    is_read BOOLEAN NOT NULL DEFAULT false,
    link TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 14. AI Conversations & Messages
CREATE TABLE IF NOT EXISTS public.ai_conversations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    title TEXT NOT NULL DEFAULT 'Financial Advice',
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE TABLE IF NOT EXISTS public.ai_messages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    conversation_id UUID NOT NULL REFERENCES public.ai_conversations(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    role VARCHAR(20) NOT NULL CHECK (role IN ('user', 'assistant', 'system')),
    content TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- Indexes for high-performance querying
CREATE INDEX IF NOT EXISTS idx_accounts_user_id ON public.accounts(user_id);
CREATE INDEX IF NOT EXISTS idx_transactions_user_id ON public.transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_transactions_account_id ON public.transactions(account_id);
CREATE INDEX IF NOT EXISTS idx_transactions_category_id ON public.transactions(category_id);
CREATE INDEX IF NOT EXISTS idx_transactions_date ON public.transactions(date);
CREATE INDEX IF NOT EXISTS idx_budgets_user_date ON public.budgets(user_id, year, month);
CREATE INDEX IF NOT EXISTS idx_savings_goals_user ON public.savings_goals(user_id);
CREATE INDEX IF NOT EXISTS idx_recurring_next ON public.recurring_transactions(next_occurrence) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_reminders_due ON public.reminders(due_date) WHERE status = 'pending';
CREATE INDEX IF NOT EXISTS idx_notifications_user_unread ON public.notifications(user_id, is_read);

-- Triggers for automatic Account Balance updates
CREATE OR REPLACE FUNCTION public.handle_transaction_balance_change()
RETURNS TRIGGER AS $$
BEGIN
    IF (TG_OP = 'INSERT') THEN
        IF NEW.type = 'income' THEN
            UPDATE public.accounts
            SET current_balance = current_balance + NEW.amount,
                updated_at = timezone('utc'::text, now())
            WHERE id = NEW.account_id;
        ELSIF NEW.type = 'expense' THEN
            UPDATE public.accounts
            SET current_balance = current_balance - NEW.amount,
                updated_at = timezone('utc'::text, now())
            WHERE id = NEW.account_id;
        ELSIF NEW.type = 'transfer' THEN
            UPDATE public.accounts
            SET current_balance = current_balance - NEW.amount,
                updated_at = timezone('utc'::text, now())
            WHERE id = NEW.account_id;
            
            IF NEW.to_account_id IS NOT NULL THEN
                UPDATE public.accounts
                SET current_balance = current_balance + NEW.amount,
                    updated_at = timezone('utc'::text, now())
                WHERE id = NEW.to_account_id;
            END IF;
        END IF;
        RETURN NEW;

    ELSIF (TG_OP = 'UPDATE') THEN
        -- Revert old transaction effect
        IF OLD.type = 'income' THEN
            UPDATE public.accounts
            SET current_balance = current_balance - OLD.amount
            WHERE id = OLD.account_id;
        ELSIF OLD.type = 'expense' THEN
            UPDATE public.accounts
            SET current_balance = current_balance + OLD.amount
            WHERE id = OLD.account_id;
        ELSIF OLD.type = 'transfer' THEN
            UPDATE public.accounts
            SET current_balance = current_balance + OLD.amount
            WHERE id = OLD.account_id;
            IF OLD.to_account_id IS NOT NULL THEN
                UPDATE public.accounts
                SET current_balance = current_balance - OLD.amount
                WHERE id = OLD.to_account_id;
            END IF;
        END IF;

        -- Apply new transaction effect
        IF NEW.type = 'income' THEN
            UPDATE public.accounts
            SET current_balance = current_balance + NEW.amount,
                updated_at = timezone('utc'::text, now())
            WHERE id = NEW.account_id;
        ELSIF NEW.type = 'expense' THEN
            UPDATE public.accounts
            SET current_balance = current_balance - NEW.amount,
                updated_at = timezone('utc'::text, now())
            WHERE id = NEW.account_id;
        ELSIF NEW.type = 'transfer' THEN
            UPDATE public.accounts
            SET current_balance = current_balance - NEW.amount,
                updated_at = timezone('utc'::text, now())
            WHERE id = NEW.account_id;
            IF NEW.to_account_id IS NOT NULL THEN
                UPDATE public.accounts
                SET current_balance = current_balance + NEW.amount,
                    updated_at = timezone('utc'::text, now())
                WHERE id = NEW.to_account_id;
            END IF;
        END IF;
        RETURN NEW;

    ELSIF (TG_OP = 'DELETE') THEN
        -- Revert deleted transaction effect
        IF OLD.type = 'income' THEN
            UPDATE public.accounts
            SET current_balance = current_balance - OLD.amount,
                updated_at = timezone('utc'::text, now())
            WHERE id = OLD.account_id;
        ELSIF OLD.type = 'expense' THEN
            UPDATE public.accounts
            SET current_balance = current_balance + OLD.amount,
                updated_at = timezone('utc'::text, now())
            WHERE id = OLD.account_id;
        ELSIF OLD.type = 'transfer' THEN
            UPDATE public.accounts
            SET current_balance = current_balance + OLD.amount,
                updated_at = timezone('utc'::text, now())
            WHERE id = OLD.account_id;
            IF OLD.to_account_id IS NOT NULL THEN
                UPDATE public.accounts
                SET current_balance = current_balance - OLD.amount,
                    updated_at = timezone('utc'::text, now())
                WHERE id = OLD.to_account_id;
            END IF;
        END IF;
        RETURN OLD;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS tr_transaction_balance ON public.transactions;
CREATE TRIGGER tr_transaction_balance
AFTER INSERT OR UPDATE OR DELETE ON public.transactions
FOR EACH ROW EXECUTE FUNCTION public.handle_transaction_balance_change();

-- Trigger for Goal Contributions to update Savings Goal balance
CREATE OR REPLACE FUNCTION public.handle_goal_contribution()
RETURNS TRIGGER AS $$
BEGIN
    IF (TG_OP = 'INSERT') THEN
        UPDATE public.savings_goals
        SET current_amount = current_amount + NEW.amount,
            status = CASE WHEN (current_amount + NEW.amount) >= target_amount THEN 'completed' ELSE 'active' END,
            updated_at = timezone('utc'::text, now())
        WHERE id = NEW.goal_id;
        RETURN NEW;
    ELSIF (TG_OP = 'DELETE') THEN
        UPDATE public.savings_goals
        SET current_amount = GREATEST(0.00, current_amount - OLD.amount),
            status = CASE WHEN (current_amount - OLD.amount) >= target_amount THEN 'completed' ELSE 'active' END,
            updated_at = timezone('utc'::text, now())
        WHERE id = OLD.goal_id;
        RETURN OLD;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS tr_goal_contribution ON public.goal_contributions;
CREATE TRIGGER tr_goal_contribution
AFTER INSERT OR DELETE ON public.goal_contributions
FOR EACH ROW EXECUTE FUNCTION public.handle_goal_contribution();

-- Profile & User Preferences automatic creation on Auth signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.profiles (id, full_name, email, avatar_url)
    VALUES (
        NEW.id,
        COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
        NEW.email,
        COALESCE(NEW.raw_user_meta_data->>'avatar_url', '')
    )
    ON CONFLICT (id) DO NOTHING;

    INSERT INTO public.user_preferences (user_id)
    VALUES (NEW.id)
    ON CONFLICT (user_id) DO NOTHING;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Enable Row Level Security (RLS) on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.budgets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.savings_goals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.goal_contributions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.recurring_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.recurring_occurrences ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reminders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_messages ENABLE ROW LEVEL SECURITY;

-- RLS Policies
-- Profiles: Users can view & update their own profile
CREATE POLICY "Users can view own profile" ON public.profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = id);

-- Preferences
CREATE POLICY "Users can view own preferences" ON public.user_preferences FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own preferences" ON public.user_preferences FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own preferences" ON public.user_preferences FOR UPDATE USING (auth.uid() = user_id);

-- Accounts
CREATE POLICY "Users can view own accounts" ON public.accounts FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own accounts" ON public.accounts FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own accounts" ON public.accounts FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own accounts" ON public.accounts FOR DELETE USING (auth.uid() = user_id);

-- Categories (Users see system categories + their own custom categories)
CREATE POLICY "Users can view categories" ON public.categories FOR SELECT USING (user_id IS NULL OR auth.uid() = user_id);
CREATE POLICY "Users can insert custom categories" ON public.categories FOR INSERT WITH CHECK (auth.uid() = user_id AND is_system = false);
CREATE POLICY "Users can update custom categories" ON public.categories FOR UPDATE USING (auth.uid() = user_id AND is_system = false);
CREATE POLICY "Users can delete custom categories" ON public.categories FOR DELETE USING (auth.uid() = user_id AND is_system = false);

-- Transactions
CREATE POLICY "Users can view own transactions" ON public.transactions FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own transactions" ON public.transactions FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own transactions" ON public.transactions FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own transactions" ON public.transactions FOR DELETE USING (auth.uid() = user_id);

-- Budgets
CREATE POLICY "Users can view own budgets" ON public.budgets FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own budgets" ON public.budgets FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own budgets" ON public.budgets FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own budgets" ON public.budgets FOR DELETE USING (auth.uid() = user_id);

-- Savings Goals
CREATE POLICY "Users can view own savings goals" ON public.savings_goals FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own savings goals" ON public.savings_goals FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own savings goals" ON public.savings_goals FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own savings goals" ON public.savings_goals FOR DELETE USING (auth.uid() = user_id);

-- Goal Contributions
CREATE POLICY "Users can view own goal contributions" ON public.goal_contributions FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own goal contributions" ON public.goal_contributions FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete own goal contributions" ON public.goal_contributions FOR DELETE USING (auth.uid() = user_id);

-- Recurring Transactions
CREATE POLICY "Users can view own recurring transactions" ON public.recurring_transactions FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own recurring transactions" ON public.recurring_transactions FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own recurring transactions" ON public.recurring_transactions FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own recurring transactions" ON public.recurring_transactions FOR DELETE USING (auth.uid() = user_id);

-- Recurring Occurrences
CREATE POLICY "Users can view own occurrences" ON public.recurring_occurrences FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own occurrences" ON public.recurring_occurrences FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Reminders
CREATE POLICY "Users can view own reminders" ON public.reminders FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own reminders" ON public.reminders FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own reminders" ON public.reminders FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own reminders" ON public.reminders FOR DELETE USING (auth.uid() = user_id);

-- Notifications
CREATE POLICY "Users can view own notifications" ON public.notifications FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own notifications" ON public.notifications FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own notifications" ON public.notifications FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own notifications" ON public.notifications FOR DELETE USING (auth.uid() = user_id);

-- AI Conversations
CREATE POLICY "Users can view own ai conversations" ON public.ai_conversations FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own ai conversations" ON public.ai_conversations FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete own ai conversations" ON public.ai_conversations FOR DELETE USING (auth.uid() = user_id);

-- AI Messages
CREATE POLICY "Users can view own ai messages" ON public.ai_messages FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own ai messages" ON public.ai_messages FOR INSERT WITH CHECK (auth.uid() = user_id);
