import { NextRequest } from "next/server";
import { getAuthenticatedUser, successResponse, errorResponse } from "@/lib/api-response";
import { getDeterministicFinancialContext, askFinancialAdvisor } from "@/lib/ai/financial-advisor";
import { z } from "zod";

const chatRequestSchema = z.object({
  message: z.string().min(1, "Message cannot be empty").max(1000),
  conversationId: z.string().uuid().optional(),
});

export async function POST(request: NextRequest) {
  try {
    const { supabase, user, error } = await getAuthenticatedUser();
    if (error || !user) {
      return errorResponse("Unauthorized", 401);
    }

    const body = await request.json();
    const validated = chatRequestSchema.safeParse(body);
    if (!validated.success) {
      return errorResponse("Validation failed", 422, validated.error.flatten().fieldErrors);
    }

    const { message, conversationId } = validated.data;

    // 1. Get or create conversation
    let convId = conversationId;
    if (!convId) {
      const title = message.length > 40 ? `${message.substring(0, 37)}...` : message;
      const { data: newConv } = await supabase
        .from("ai_conversations")
        .insert({
          user_id: user.id,
          title,
        })
        .select("id")
        .single();
      convId = newConv?.id;
    }

    // 2. Persist user message
    if (convId) {
      await supabase.from("ai_messages").insert({
        conversation_id: convId,
        user_id: user.id,
        role: "user",
        content: message,
      });
    }

    // 3. Extract deterministic financial context for this authenticated user
    const financialContext = await getDeterministicFinancialContext(supabase, user.id);

    // 4. Generate answer via AI or deterministic financial reasoning
    const advisorResponse = await askFinancialAdvisor(message, financialContext);

    // 5. Persist assistant response
    if (convId) {
      await supabase.from("ai_messages").insert({
        conversation_id: convId,
        user_id: user.id,
        role: "assistant",
        content: advisorResponse.answer,
      });
    }

    return successResponse({
      conversationId: convId,
      answer: advisorResponse.answer,
      provider: advisorResponse.provider,
    });
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : "Internal Server Error";
    return errorResponse(errorMsg, 500);
  }
}
