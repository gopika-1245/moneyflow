import { NextRequest } from "next/server";
import { successResponse, errorResponse } from "@/lib/api-response";
import { createAdminClient } from "@/lib/supabase/admin";
import { getCatchUpOccurrences, calculateNextOccurrence } from "@/lib/calculations/finance";
import { format, parseISO } from "date-fns";

export async function GET(request: NextRequest) {
  return handleRecurringCron(request);
}

export async function POST(request: NextRequest) {
  return handleRecurringCron(request);
}

async function handleRecurringCron(request: NextRequest) {
  try {
    // Authorize Cron request
    const authHeader = request.headers.get("authorization");
    const { searchParams } = new URL(request.url);
    const querySecret = searchParams.get("secret");
    const expectedSecret = process.env.CRON_SECRET;

    const isAuthorized =
      (expectedSecret && authHeader === `Bearer ${expectedSecret}`) ||
      (expectedSecret && querySecret === expectedSecret) ||
      process.env.NODE_ENV === "development"; // allow manual test in dev

    if (!isAuthorized) {
      return errorResponse("Unauthorized cron request", 401);
    }

    const admin = createAdminClient();
    const today = new Date();
    const todayStr = format(today, "yyyy-MM-dd");

    // Fetch all active recurring transactions that are due (next_occurrence <= today)
    const { data: recurringList, error: fetchError } = await admin
      .from("recurring_transactions")
      .select("*")
      .eq("is_active", true)
      .lte("next_occurrence", todayStr);

    if (fetchError) {
      return errorResponse(`Failed to fetch recurring rules: ${fetchError.message}`, 500);
    }

    let processedCount = 0;
    let createdTransactions = 0;

    for (const rule of recurringList || []) {
      // Get all due dates according to catch-up policy
      const dueDates = getCatchUpOccurrences(rule.next_occurrence, rule.frequency, rule.end_date, today);

      let lastProcessedDate = rule.next_occurrence;

      for (const occDate of dueDates) {
        const occKey = `occ_${rule.id}_${occDate}`;

        // Attempt to insert occurrence record (with unique occurrence_key)
        const { data: occRecord, error: occError } = await admin
          .from("recurring_occurrences")
          .insert({
            recurring_id: rule.id,
            user_id: rule.user_id,
            occurrence_date: occDate,
            occurrence_key: occKey,
            status: "processing",
          })
          .select("id")
          .single();

        // If error code is 23505 (unique constraint violation), it already ran! Skip!
        if (occError) {
          continue;
        }

        // Create actual transaction
        const { data: tx, error: txError } = await admin
          .from("transactions")
          .insert({
            user_id: rule.user_id,
            title: rule.title,
            description: `Automated recurring: ${rule.frequency}`,
            amount: rule.amount,
            type: rule.type,
            category_id: rule.category_id,
            account_id: rule.account_id,
            to_account_id: rule.to_account_id,
            date: occDate,
            is_recurring: true,
            recurring_rule_id: rule.id,
            notes: rule.notes,
          })
          .select("id")
          .single();

        if (tx && !txError) {
          createdTransactions++;
          // Update occurrence record with transaction_id
          await admin
            .from("recurring_occurrences")
            .update({ transaction_id: tx.id, status: "completed" })
            .eq("id", occRecord.id);

          // Create notification for user
          await admin.from("notifications").insert({
            user_id: rule.user_id,
            title: "Recurring Transaction Processed",
            message: `Processed: ${rule.title} for ${occDate}`,
            type: "recurring",
            link: "/transactions",
          });
        }

        lastProcessedDate = occDate;
      }

      // Compute the next occurrence after the last processed occurrence
      const nextDate = calculateNextOccurrence(parseISO(lastProcessedDate), rule.frequency);
      const nextDateStr = format(nextDate, "yyyy-MM-dd");

      // Check if rule reached end_date
      const shouldDeactivate = rule.end_date && nextDateStr > rule.end_date;

      await admin
        .from("recurring_transactions")
        .update({
          next_occurrence: nextDateStr,
          is_active: shouldDeactivate ? false : true,
          updated_at: new Date().toISOString(),
        })
        .eq("id", rule.id);

      processedCount++;
    }

    return successResponse({
      message: "Recurring transactions processed successfully",
      rulesEvaluated: recurringList?.length || 0,
      rulesProcessed: processedCount,
      transactionsCreated: createdTransactions,
      timestamp: new Date().toISOString(),
    });
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : "Internal Server Error";
    return errorResponse(errorMsg, 500);
  }
}
