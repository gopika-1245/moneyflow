import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedUser, errorResponse } from "@/lib/api-response";
import { calculateCashFlowMetrics } from "@/lib/calculations/finance";
import { formatCurrency, formatDate } from "@/lib/utils";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { TransactionItem } from "@/types/finance";

export async function GET(request: NextRequest) {
  try {
    const { supabase, user, error } = await getAuthenticatedUser();
    if (error || !user) {
      return errorResponse("Unauthorized", 401);
    }

    const { searchParams } = new URL(request.url);
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");
    const type = searchParams.get("type");
    const categoryId = searchParams.get("categoryId");

    let query = supabase
      .from("transactions")
      .select("*, category:categories(name), account:accounts(name, currency)")
      .eq("user_id", user.id)
      .order("date", { ascending: false });

    if (startDate) query = query.gte("date", startDate);
    if (endDate) query = query.lte("date", endDate);
    if (type) query = query.eq("type", type);
    if (categoryId) query = query.eq("category_id", categoryId);

    const { data, error: dbError } = await query;
    if (dbError) throw dbError;

    const txs = (data || []) as unknown as TransactionItem[];
    const metrics = calculateCashFlowMetrics(txs);

    // Fetch user profile
    const { data: profile } = await supabase
      .from("profiles")
      .select("full_name, email")
      .eq("id", user.id)
      .single();

    // Create jsPDF Document
    const doc = new jsPDF({
      orientation: "portrait",
      unit: "mm",
      format: "a4",
    });

    const primaryColor: [number, number, number] = [5, 150, 105]; // Emerald 600
    const darkColor: [number, number, number] = [30, 41, 59]; // Slate 800

    // Header Background Accent
    doc.setFillColor(...primaryColor);
    doc.rect(0, 0, 210, 15, "F");

    // Brand Title
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(16);
    doc.setFont("helvetica", "bold");
    doc.text("MONEYFLOW", 14, 10);

    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    doc.text("Personal Financial Statement", 140, 10);

    // Metadata section
    doc.setTextColor(...darkColor);
    doc.setFontSize(18);
    doc.setFont("helvetica", "bold");
    doc.text("Financial Activity Report", 14, 28);

    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(100, 116, 139);
    doc.text(`Account Holder: ${profile?.full_name || profile?.email || "Valued User"}`, 14, 35);
    doc.text(`Period: ${startDate || "Earliest"} to ${endDate || "Latest"}`, 14, 41);
    doc.text(`Generated on: ${formatDate(new Date())}`, 14, 47);

    // Summary KPI Cards Box
    doc.setDrawColor(226, 232, 240);
    doc.setFillColor(248, 250, 252);
    doc.roundedRect(14, 53, 182, 25, 3, 3, "FD");

    // KPI 1: Income
    doc.setFontSize(9);
    doc.setTextColor(100, 116, 139);
    doc.text("TOTAL INCOME", 22, 61);
    doc.setFontSize(12);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(5, 150, 105);
    doc.text(formatCurrency(metrics.totalIncome), 22, 70);

    // KPI 2: Expenses
    doc.setFontSize(9);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(100, 116, 139);
    doc.text("TOTAL EXPENSES", 80, 61);
    doc.setFontSize(12);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(220, 38, 38);
    doc.text(formatCurrency(metrics.totalExpenses), 80, 70);

    // KPI 3: Net Savings
    doc.setFontSize(9);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(100, 116, 139);
    doc.text("NET SAVINGS", 140, 61);
    doc.setFontSize(12);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(metrics.netSavings >= 0 ? 5 : 220, metrics.netSavings >= 0 ? 150 : 38, metrics.netSavings >= 0 ? 105 : 38);
    doc.text(formatCurrency(metrics.netSavings), 140, 70);

    // Table of Transactions
    const tableRows = txs.map((t) => [
      t.date,
      t.title,
      t.type.toUpperCase(),
      t.category?.name || "Uncategorized",
      t.account?.name || "N/A",
      formatCurrency(t.amount, t.account?.currency || "INR"),
    ]);

    autoTable(doc, {
      startY: 85,
      head: [["Date", "Title", "Type", "Category", "Account", "Amount"]],
      body: tableRows,
      theme: "striped",
      headStyles: {
        fillColor: primaryColor,
        textColor: [255, 255, 255],
        fontStyle: "bold",
        fontSize: 9,
      },
      styles: {
        fontSize: 8,
        cellPadding: 3,
        textColor: darkColor,
      },
      columnStyles: {
        5: { halign: "right", fontStyle: "bold" },
      },
      didDrawPage: (data) => {
        // Footer
        doc.setFontSize(8);
        doc.setTextColor(148, 163, 184);
        doc.text(
          "MoneyFlow — Confident, Automated Personal Finance. Generated automatically.",
          14,
          290
        );
        doc.text(`Page ${data.pageNumber}`, 190, 290);
      },
    });

    const pdfBuffer = doc.output("arraybuffer");

    return new NextResponse(pdfBuffer, {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="moneyflow-report-${new Date().toISOString().split("T")[0]}.pdf"`,
      },
    });
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : "Internal Server Error";
    return errorResponse(errorMsg, 500);
  }
}
