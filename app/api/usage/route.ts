import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { PLAN_LIMITS } from "@/app/lib/stripe";

function getSupabaseAdmin() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || "";
  return createClient(supabaseUrl, supabaseServiceKey);
}

// GET - Get user's daily usage
export async function GET(request: NextRequest) {
  try {
    const userId = request.nextUrl.searchParams.get("userId");
    if (!userId) {
      return NextResponse.json({ error: "Missing userId" }, { status: 400 });
    }

    const supabase = getSupabaseAdmin();

    // Get user plan
    const { data: profile } = await supabase
      .from("user_profiles")
      .select("plan")
      .eq("user_id", userId)
      .single();

    const plan = profile?.plan || "free";
    const limits = PLAN_LIMITS[plan as keyof typeof PLAN_LIMITS] || PLAN_LIMITS.free;

    // Get today's message count
    const today = new Date().toISOString().split("T")[0]; // YYYY-MM-DD
    const { data: usage } = await supabase
      .from("daily_usage")
      .select("message_count")
      .eq("user_id", userId)
      .eq("date", today)
      .single();

    const messageCount = usage?.message_count || 0;
    const limit = limits.messagesPerDay;
    const remaining = limit === -1 ? -1 : Math.max(0, limit - messageCount);

    return NextResponse.json({
      plan,
      messagesUsed: messageCount,
      messagesLimit: limit,
      messagesRemaining: remaining,
      allowedModels: limits.models,
    });
  } catch (error: any) {
    console.error("[Usage] Error:", error.message);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// POST - Increment usage count
export async function POST(request: NextRequest) {
  try {
    const { userId } = await request.json();
    if (!userId) {
      return NextResponse.json({ error: "Missing userId" }, { status: 400 });
    }

    const supabase = getSupabaseAdmin();

    // Get user plan
    const { data: profile } = await supabase
      .from("user_profiles")
      .select("plan")
      .eq("user_id", userId)
      .single();

    const plan = profile?.plan || "free";
    const limits = PLAN_LIMITS[plan as keyof typeof PLAN_LIMITS] || PLAN_LIMITS.free;

    const today = new Date().toISOString().split("T")[0];

    // Get current count
    const { data: usage } = await supabase
      .from("daily_usage")
      .select("message_count")
      .eq("user_id", userId)
      .eq("date", today)
      .single();

    const currentCount = usage?.message_count || 0;

    // Check limit (skip for pro/unlimited)
    if (limits.messagesPerDay !== -1 && currentCount >= limits.messagesPerDay) {
      return NextResponse.json(
        {
          error: "Daily message limit reached",
          limit: limits.messagesPerDay,
          used: currentCount,
        },
        { status: 429 },
      );
    }

    // Upsert usage count
    await supabase.from("daily_usage").upsert(
      {
        user_id: userId,
        date: today,
        message_count: currentCount + 1,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "user_id,date" },
    );

    return NextResponse.json({
      success: true,
      messagesUsed: currentCount + 1,
      messagesLimit: limits.messagesPerDay,
    });
  } catch (error: any) {
    console.error("[Usage] Error:", error.message);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
