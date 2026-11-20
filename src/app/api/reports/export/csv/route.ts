import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedUser, errorResponse } from "@/lib/api-response";
import { sanitizeCsvField } from "@/lib/utils";
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
    const accountId = searchParams.get("accountId");

    let query = supabase
      .from("transactions")
      .select("*, category:categories(name), account:accounts(name, currency)")
      .eq("user_id", user.id)
      .order("date", { ascending: false });

    if (startDate) query = query.gte("date", startDate);
    if (endDate) query = query.lte("date", endDate);
    if (type) query = query.eq("type", type);
    if (categoryId) query = query.eq("category_id", categoryId);
    if (accountId) query = query.eq("account_id", accountId);

    const { data, error: dbError } = await query;
    if (dbError) throw dbError;

    const txs = data || [];

    // CSV Headers
    const headers = [
      "Date",
      "Title",
      "Type",
      "Category",
      "Account",
      "Amount",
      "Currency",
      "Payment Method",
      "Description",
      "Notes",
    ];

    const rows = txs.map((t) => [
      sanitizeCsvField(t.date),
      sanitizeCsvField(t.title),
      sanitizeCsvField(t.type.toUpperCase()),
      sanitizeCsvField(t.category?.name || "Uncategorized"),
      sanitizeCsvField(t.account?.name || "N/A"),
      sanitizeCsvField(t.amount),
      sanitizeCsvField(t.account?.currency || "INR"),
      sanitizeCsvField(t.payment_method || ""),
      sanitizeCsvField(t.description || ""),
      sanitizeCsvField(t.notes || ""),
    ]);

    const csvContent =
      "\uFEFF" + // UTF-8 Byte Order Mark for Excel
      [headers.join(","), ...rows.map((r) => r.join(","))].join("\r\n");

    const filename = `moneyflow-statement-${new Date().toISOString().split("T")[0]}.csv`;

    return new NextResponse(csvContent, {
      status: 200,
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="${filename}"`,
      },
    });
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : "Internal Server Error";
    return errorResponse(errorMsg, 500);
  }
}
