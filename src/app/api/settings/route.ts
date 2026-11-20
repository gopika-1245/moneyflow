import { NextRequest } from "next/server";
import { getAuthenticatedUser, successResponse, errorResponse } from "@/lib/api-response";
import { preferencesSchema } from "@/lib/validations";
import { z } from "zod";

const updateProfileSchema = z.object({
  fullName: z.string().min(1).max(100).optional(),
  avatarUrl: z.string().url().optional().nullable(),
  newPassword: z.string().min(8).optional(),
  preferences: preferencesSchema.partial().optional(),
});

export async function GET() {
  try {
    const { supabase, user, error } = await getAuthenticatedUser();
    if (error || !user) {
      return errorResponse("Unauthorized", 401);
    }

    const { data: profile } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", user.id)
      .single();

    const { data: preferences } = await supabase
      .from("user_preferences")
      .select("*")
      .eq("user_id", user.id)
      .single();

    return successResponse({
      user: {
        id: user.id,
        email: user.email,
        full_name: profile?.full_name || "",
        avatar_url: profile?.avatar_url || "",
      },
      preferences: preferences || {
        default_currency: "INR",
        date_format: "dd/MM/yyyy",
        number_format: "en-IN",
        theme: "system",
        budget_alerts: true,
        recurring_alerts: true,
        reminder_alerts: true,
      },
    });
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : "Internal Server Error";
    return errorResponse(errorMsg, 500);
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const { supabase, user, error } = await getAuthenticatedUser();
    if (error || !user) {
      return errorResponse("Unauthorized", 401);
    }

    const body = await request.json();
    const validated = updateProfileSchema.safeParse(body);
    if (!validated.success) {
      return errorResponse("Validation failed", 422, validated.error.flatten().fieldErrors);
    }

    const { fullName, avatarUrl, newPassword, preferences } = validated.data;

    // 1. Update Profile if provided
    if (fullName !== undefined || avatarUrl !== undefined) {
      const profileUpdates: any = {
        updated_at: new Date().toISOString(),
      };
      if (fullName !== undefined) profileUpdates.full_name = fullName;
      if (avatarUrl !== undefined) profileUpdates.avatar_url = avatarUrl;

      await supabase.from("profiles").update(profileUpdates).eq("id", user.id);
    }

    // 2. Update Password if provided
    if (newPassword) {
      const { error: pwdError } = await supabase.auth.updateUser({
        password: newPassword,
      });
      if (pwdError) {
        return errorResponse(pwdError.message, 400);
      }
    }

    // 3. Update Preferences if provided
    if (preferences) {
      const prefUpdates: any = {
        updated_at: new Date().toISOString(),
      };
      if (preferences.defaultCurrency !== undefined) prefUpdates.default_currency = preferences.defaultCurrency;
      if (preferences.dateFormat !== undefined) prefUpdates.date_format = preferences.dateFormat;
      if (preferences.numberFormat !== undefined) prefUpdates.number_format = preferences.numberFormat;
      if (preferences.theme !== undefined) prefUpdates.theme = preferences.theme;
      if (preferences.budgetAlerts !== undefined) prefUpdates.budget_alerts = preferences.budgetAlerts;
      if (preferences.recurringAlerts !== undefined) prefUpdates.recurring_alerts = preferences.recurringAlerts;
      if (preferences.reminderAlerts !== undefined) prefUpdates.reminder_alerts = preferences.reminderAlerts;

      await supabase
        .from("user_preferences")
        .upsert({ user_id: user.id, ...prefUpdates }, { onConflict: "user_id" });
    }

    return successResponse({ message: "Settings updated successfully" });
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : "Internal Server Error";
    return errorResponse(errorMsg, 500);
  }
}
