import { NextRequest } from "next/server";
import { getAuthenticatedUser, successResponse, errorResponse } from "@/lib/api-response";
import { transactionSchema } from "@/lib/validations";

export async function GET(request: NextRequest) {
  try {
    const { supabase, user, error } = await getAuthenticatedUser();
    if (error || !user) {
      return errorResponse("Unauthorized", 401);
    }

    const { searchParams } = new URL(request.url);
    const type = searchParams.get("type");
    const categoryId = searchParams.get("categoryId");
    const accountId = searchParams.get("accountId");
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");
    const minAmount = searchParams.get("minAmount");
    const maxAmount = searchParams.get("maxAmount");
    const search = searchParams.get("search");
    const sortBy = searchParams.get("sortBy") || "date";
    const sortOrder = searchParams.get("sortOrder") === "asc" ? true : false;
    const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10));
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get("limit") || "20", 10)));
    const offset = (page - 1) * limit;

    let query = supabase
      .from("transactions")
      .select("*, category:categories(*), account:accounts(*), to_account:accounts!transactions_to_account_id_fkey(*)", { count: "exact" })
      .eq("user_id", user.id);

    if (type) {
      query = query.eq("type", type);
    }
    if (categoryId) {
      query = query.eq("category_id", categoryId);
    }
    if (accountId) {
      query = query.eq("account_id", accountId);
    }
    if (startDate) {
      query = query.gte("date", startDate);
    }
    if (endDate) {
      query = query.lte("date", endDate);
    }
    if (minAmount) {
      query = query.gte("amount", parseFloat(minAmount));
    }
    if (maxAmount) {
      query = query.lte("amount", parseFloat(maxAmount));
    }
    if (search) {
      query = query.ilike("title", `%${search}%`);
    }

    query = query
      .order(sortBy, { ascending: sortOrder })
      .range(offset, offset + limit - 1);

    const { data, count, error: dbError } = await query;
    if (dbError) throw dbError;

    const totalPages = Math.ceil((count || 0) / limit);

    return successResponse({
      transactions: data || [],
      pagination: {
        page,
        limit,
        totalItems: count || 0,
        totalPages,
        hasMore: page < totalPages,
      },
    });
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : "Internal Server Error";
    return errorResponse(errorMsg, 500);
  }
}

export async function POST(request: NextRequest) {
  try {
    const { supabase, user, error } = await getAuthenticatedUser();
    if (error || !user) {
      return errorResponse("Unauthorized", 401);
    }

    const body = await request.json();
    const validated = transactionSchema.safeParse(body);
    if (!validated.success) {
      return errorResponse("Validation failed", 422, validated.error.flatten().fieldErrors);
    }

    const {
      title,
      description,
      amount,
      type,
      categoryId,
      accountId,
      toAccountId,
      date,
      paymentMethod,
      notes,
    } = validated.data;

    // Verify account ownership
    const { data: account, error: accError } = await supabase
      .from("accounts")
      .select("id")
      .eq("id", accountId)
      .eq("user_id", user.id)
      .single();

    if (accError || !account) {
      return errorResponse("Invalid account selection", 400);
    }

    if (type === "transfer" && toAccountId) {
      if (toAccountId === accountId) {
        return errorResponse("Source and destination accounts must be different", 400);
      }
      const { data: toAcc } = await supabase
        .from("accounts")
        .select("id")
        .eq("id", toAccountId)
        .eq("user_id", user.id)
        .single();

      if (!toAcc) {
        return errorResponse("Invalid destination account selection", 400);
      }
    }

    const { data, error: insertError } = await supabase
      .from("transactions")
      .insert({
        user_id: user.id,
        title,
        description,
        amount,
        type,
        category_id: categoryId || null,
        account_id: accountId,
        to_account_id: type === "transfer" ? toAccountId : null,
        date,
        payment_method: paymentMethod || null,
        notes: notes || null,
      })
      .select("*, category:categories(*), account:accounts(*)")
      .single();

    if (insertError) throw insertError;

    return successResponse(data, 201);
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : "Internal Server Error";
    return errorResponse(errorMsg, 500);
  }
}
