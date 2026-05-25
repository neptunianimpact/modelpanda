import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { PLAN_LIMITS } from "@/app/lib/stripe";

function getSupabaseAdmin() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || "";
  return createClient(supabaseUrl, supabaseServiceKey);
}

// Verify JWT token and return authenticated user ID
async function verifyAuth(request: NextRequest): Promise<{ userId: string | null; error: string | null }> {
  const authHeader = request.headers.get("Authorization");
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return { userId: null, error: "Missing or invalid Authorization header" };
  }

  const token = authHeader.replace("Bearer ", "");
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";
  const supabase = createClient(supabaseUrl, supabaseAnonKey);

  const { data: { user }, error } = await supabase.auth.getUser(token);
  if (error || !user) {
    return { userId: null, error: "Invalid or expired token" };
  }

  return { userId: user.id, error: null };
}

// GET - Get user's daily usage
export async function GET(request: NextRequest) {
  try {
    // Verify authentication
    const auth = await verifyAuth(request);
    if (auth.error) {
      return NextResponse.json({ error: auth.error }, { status: 401 });
    }

    const userId = request.nextUrl.searchParams.get("userId");
    if (!userId) {
      return NextResponse.json({ error: "Missing userId" }, { status: 400 });
    }

    // Ensure user can only query their own data
    if (userId !== auth.userId) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
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
    // Verify authentication
    const auth = await verifyAuth(request);
    if (auth.error) {
      return NextResponse.json({ error: auth.error }, { status: 401 });
    }

    const { userId } = await request.json();
    if (!userId) {
      return NextResponse.json({ error: "Missing userId" }, { status: 400 });
    }

    // Ensure user can only modify their own data
    if (userId !== auth.userId) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
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
