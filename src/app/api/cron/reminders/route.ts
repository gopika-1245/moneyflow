import { NextRequest } from "next/server";
import { successResponse, errorResponse } from "@/lib/api-response";
import { createAdminClient } from "@/lib/supabase/admin";
import { format } from "date-fns";

export async function GET(request: NextRequest) {
  return handleRemindersCron(request);
}

export async function POST(request: NextRequest) {
  return handleRemindersCron(request);
}

async function handleRemindersCron(request: NextRequest) {
  try {
    const authHeader = request.headers.get("authorization");
    const { searchParams } = new URL(request.url);
    const querySecret = searchParams.get("secret");
    const expectedSecret = process.env.CRON_SECRET;

    const isAuthorized =
      (expectedSecret && authHeader === `Bearer ${expectedSecret}`) ||
      (expectedSecret && querySecret === expectedSecret) ||
      process.env.NODE_ENV === "development";

    if (!isAuthorized) {
      return errorResponse("Unauthorized cron request", 401);
    }

    const admin = createAdminClient();
    const todayStr = format(new Date(), "yyyy-MM-dd");

    // Fetch pending reminders due today or overdue
    const { data: dueReminders, error: fetchError } = await admin
      .from("reminders")
      .select("*")
      .eq("status", "pending")
      .lte("due_date", todayStr);

    if (fetchError) {
      return errorResponse(`Failed to fetch reminders: ${fetchError.message}`, 500);
    }

    let notificationsCreated = 0;

    for (const rem of dueReminders || []) {
      // Check if notification was already sent today for this reminder to prevent duplicates
      const notifTitle = `Reminder: ${rem.title}`;
      const { data: existingNotif } = await admin
        .from("notifications")
        .select("id")
        .eq("user_id", rem.user_id)
        .eq("title", notifTitle)
        .gte("created_at", `${todayStr}T00:00:00Z`)
        .limit(1);

      if (existingNotif && existingNotif.length > 0) {
        continue;
      }

      await admin.from("notifications").insert({
        user_id: rem.user_id,
        title: notifTitle,
        message: rem.description || `Payment or reminder due on ${rem.due_date}`,
        type: "reminder",
        link: "/reminders",
      });

      notificationsCreated++;
    }

    return successResponse({
      message: "Reminders processed successfully",
      remindersEvaluated: dueReminders?.length || 0,
      notificationsCreated,
      timestamp: new Date().toISOString(),
    });
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : "Internal Server Error";
    return errorResponse(errorMsg, 500);
  }
}
