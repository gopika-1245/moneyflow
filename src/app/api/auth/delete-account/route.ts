import { NextRequest } from "next/server";
import { getAuthenticatedUser, successResponse, errorResponse } from "@/lib/api-response";
import { createAdminClient } from "@/lib/supabase/admin";

export async function POST(request: NextRequest) {
  try {
    const { user, error } = await getAuthenticatedUser();
    if (error || !user) {
      return errorResponse("Unauthorized", 401);
    }

    const body = await request.json().catch(() => ({}));
    if (body.confirmation !== "DELETE_MY_ACCOUNT") {
      return errorResponse("Please confirm account deletion by sending confirmation: 'DELETE_MY_ACCOUNT'", 400);
    }

    // Use admin client to delete the user from auth.users (cascades to all user tables)
    const admin = createAdminClient();
    const { error: deleteError } = await admin.auth.admin.deleteUser(user.id);

    if (deleteError) {
      return errorResponse(deleteError.message, 500);
    }

    return successResponse({ message: "Account deleted successfully" });
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : "Internal Server Error";
    return errorResponse(errorMsg, 500);
  }
}
