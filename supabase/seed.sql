-- Default System Categories for MoneyFlow
-- Expense Categories
INSERT INTO public.categories (name, type, icon, color, is_system) VALUES
('Food', 'expense', 'Utensils', '#ef4444', true),
('Transportation', 'expense', 'Car', '#f97316', true),
('Fuel', 'expense', 'Fuel', '#f59e0b', true),
('Shopping', 'expense', 'ShoppingBag', '#ec4899', true),
('Education', 'expense', 'GraduationCap', '#8b5cf6', true),
('Rent', 'expense', 'Home', '#6366f1', true),
('Utilities', 'expense', 'Zap', '#3b82f6', true),
('Entertainment', 'expense', 'Film', '#06b6d4', true),
('Healthcare', 'expense', 'HeartPulse', '#10b981', true),
('Subscriptions', 'expense', 'Tv', '#14b8a6', true),
('Travel', 'expense', 'Plane', '#84cc16', true),
('Other Expense', 'expense', 'MoreHorizontal', '#64748b', true)
ON CONFLICT DO NOTHING;

-- Income Categories
INSERT INTO public.categories (name, type, icon, color, is_system) VALUES
('Salary', 'income', 'Briefcase', '#10b981', true),
('Freelance', 'income', 'Laptop', '#059669', true),
('Business', 'income', 'TrendingUp', '#047857', true),
('Investment', 'income', 'LineChart', '#0d9488', true),
('Gift', 'income', 'Gift', '#06b6d4', true),
('Other Income', 'income', 'Coins', '#64748b', true)
ON CONFLICT DO NOTHING;
