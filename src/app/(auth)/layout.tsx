import Link from "next/link";
import { ThemeToggle } from "@/components/theme-toggle";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex flex-col justify-between bg-muted/20">
      {/* Top Navbar */}
      <header className="p-4 sm:p-6 flex items-center justify-between max-w-6xl mx-auto w-full">
        <Link href="/" className="flex items-center gap-2 font-bold text-xl tracking-tight">
          <div className="h-9 w-9 rounded-xl bg-emerald-600 flex items-center justify-center text-white shadow-md shadow-emerald-500/20">
            <span className="text-lg font-black leading-none">₹</span>
          </div>
          <span className="text-xl font-extrabold tracking-tight">
            Money<span className="text-emerald-600">Flow</span>
          </span>
        </Link>
        <ThemeToggle />
      </header>

      {/* Main Form Center */}
      <main className="flex-1 flex items-center justify-center p-4">{children}</main>

      {/* Footer */}
      <footer className="py-6 text-center text-xs text-muted-foreground border-t border-border/50">
        <p>© {new Date().getFullYear()} MoneyFlow. Take Control of Your Money.</p>
        <p className="mt-1 text-[11px]">Protected by Supabase SSR & PostgreSQL RLS.</p>
      </footer>
    </div>
  );
}
