import { NextRequest } from "next/server";
import { getAuthenticatedUser, successResponse, errorResponse } from "@/lib/api-response";

export async function GET(request: NextRequest) {
  try {
    const { supabase, user, error } = await getAuthenticatedUser();
    if (error || !user) {
      return errorResponse("Unauthorized", 401);
    }

    const { searchParams } = new URL(request.url);
    const conversationId = searchParams.get("conversationId");

    if (conversationId) {
      // Fetch messages for a specific conversation
      const { data: messages, error: msgError } = await supabase
        .from("ai_messages")
        .select("*")
        .eq("conversation_id", conversationId)
        .eq("user_id", user.id)
        .order("created_at", { ascending: true });

      if (msgError) throw msgError;

      return successResponse({ messages: messages || [] });
    }

    // Fetch conversation list
    const { data: conversations, error: convError } = await supabase
      .from("ai_conversations")
      .select("*")
      .eq("user_id", user.id)
      .order("updated_at", { ascending: false });

    if (convError) throw convError;

    return successResponse({ conversations: conversations || [] });
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : "Internal Server Error";
    return errorResponse(errorMsg, 500);
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { supabase, user, error } = await getAuthenticatedUser();
    if (error || !user) {
      return errorResponse("Unauthorized", 401);
    }

    const { searchParams } = new URL(request.url);
    const conversationId = searchParams.get("conversationId");

    if (!conversationId) {
      return errorResponse("Conversation ID is required", 400);
    }

    const { error: deleteError } = await supabase
      .from("ai_conversations")
      .delete()
      .eq("id", conversationId)
      .eq("user_id", user.id);

    if (deleteError) throw deleteError;

    return successResponse({ message: "Conversation deleted successfully" });
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : "Internal Server Error";
    return errorResponse(errorMsg, 500);
  }
}
