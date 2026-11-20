# MoneyFlow — Take Control of Your Money

> A production-ready, full-stack personal finance management platform built with Next.js App Router, TypeScript, Tailwind CSS, and Supabase PostgreSQL.

---

## 🌟 Key Features

- **Dashboard Intelligence:** Real-time net worth, asset/liability tracking, cash flow comparison, and spending analytics.
- **Transaction Management:** Multi-currency support (default **INR ₹**), advanced filters (type, category, account, date, amount), and instant CSV/PDF exports.
- **Multi-Account Management:** Cash, Savings, Current, Digital Wallets, and Credit Cards with atomic fund transfers and liability tracking.
- **Budget Management:** Category-specific monthly limits, live utilization tracking, and warning/exceeded status alerts.
- **Savings Goals:** Target tracking for emergency funds, dream purchases, with auditable deposit and correction logs.
- **Recurring Transactions:** Automated recurring entries (Daily, Weekly, Monthly, Quarterly, Yearly) with idempotent processing via **Vercel Cron**.
- **Financial Reminders:** Bill due dates, overdue alert badges, and in-app notifications.
- **AI Financial Assistant:** Natural-language financial guidance calculating metrics directly from real database records (supports Gemini API or deterministic financial analytics fallback).
- **Reports & Statement Exports:** Filtered ledger reports with **PDF download** (via jsPDF) and **CSV export** protected against formula injection (CWE-1236).
- **Security & Privacy:** Supabase SSR authentication, PostgreSQL Row Level Security (RLS) on all user tables, secure server-side routes, and complete account deletion workflow.

---

## 🛠 Technology Stack

- **Framework:** Next.js 14 App Router (React 18, TypeScript)
- **Styling & UI:** Tailwind CSS, Lucide React, Sonner (toast notifications)
- **Data Visualizations:** Recharts
- **Database & Auth:** Supabase PostgreSQL, Supabase Auth, Row Level Security (RLS)
- **Validation:** Zod, React Hook Form
- **Exports:** jsPDF, jsPDF-AutoTable, PapaParse
- **Testing:** Vitest
- **Deployment:** Vercel (Frontend & Serverless API Route Handlers) + Supabase (Database)

---

## 🚀 Getting Started

### 1. Clone the repository
```bash
git clone <your-repo-url>
cd moneyflow
```

### 2. Install dependencies
```bash
npm install
```

### 3. Setup Environment Variables
Copy `.env.example` to `.env.local` and configure your credentials:
```bash
cp .env.example .env.local
```

Fill in your configuration:
```env
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOi...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOi...

# App URL
NEXT_PUBLIC_APP_URL=http://localhost:3000

# Vercel Cron Secret (for securing recurring transactions)
CRON_SECRET=your_long_secure_cron_secret_key_here

# Optional AI Assistant (Gemini API)
GEMINI_API_KEY=your_gemini_api_key_here
```

### 4. Run Database Migrations
1. Open your **Supabase Dashboard** -> **SQL Editor**.
2. Run the migration file located at:
   ```
   supabase/migrations/20240101000000_init_moneyflow.sql
   ```
3. Run the seed data script located at:
   ```
   supabase/seed.sql
   ```

### 5. Start Development Server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 🧪 Testing

Run the Vitest test suite covering financial calculations, account liabilities, budget thresholds, date catch-up policy, and CSV injection sanitization:
```bash
npm run test
```

---

## ☁️ Vercel Deployment

1. Push this repository to GitHub.
2. Import the project into **Vercel**.
3. Add the environment variables from `.env.example` in Vercel Project Settings:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY`
   - `CRON_SECRET`
   - `GEMINI_API_KEY` (Optional)
4. Deploy! The scheduled cron jobs defined in `vercel.json` will automatically trigger recurring transaction processing and reminder checks.

---

## 📄 License
MIT © MoneyFlow
