import { createClient } from "@supabase/supabase-js";
import { PLAN_LIMITS } from "@/app/lib/stripe";

function getSupabaseAdmin() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || "";
  return createClient(supabaseUrl, supabaseServiceKey);
}

export async function checkUsage(userId: string, model: string) {
  const supabase = getSupabaseAdmin();

  // 1. Get user plan
  const { data: profile } = await supabase
    .from("user_profiles")
    .select("plan")
    .eq("user_id", userId)
    .single();

  const plan = (profile?.plan || "free") as keyof typeof PLAN_LIMITS;
  const limits = PLAN_LIMITS[plan] || PLAN_LIMITS.free;

  // 2. Check if model is allowed for this plan
  if (!limits.models.includes(model)) {
    return {
      allowed: false,
      error: `Model ${model} is not available on your current plan.`,
    };
  }

  const today = new Date().toISOString().split("T")[0];

  // 3. Get current usage
  const { data: usage } = await supabase
    .from("daily_usage")
    .select("message_count, premium_count")
    .eq("user_id", userId)
    .eq("date", today)
    .single();

  const messageCount = usage?.message_count || 0;
  const premiumCount = usage?.premium_count || 0;

  // 4. Check total message limit (Fair Use)
  if (limits.messagesPerDay !== -1 && messageCount >= limits.messagesPerDay) {
    return {
      allowed: false,
      error: "Daily message limit reached. Please try again tomorrow.",
    };
  }

  // 5. Check premium model limit
  const isPremiumModel = (limits as any).premiumModels?.includes(model);
  if (isPremiumModel && (limits as any).premiumModelLimit !== undefined) {
    const limit = (limits as any).premiumModelLimit;
    if (limit !== -1 && premiumCount >= limit) {
      return {
        allowed: false,
        error: `Daily limit for premium models (${model}) reached. You can still use other models.`,
      };
    }
  }

  return { allowed: true };
}

export async function incrementUsage(userId: string, model: string) {
  const supabase = getSupabaseAdmin();
  const today = new Date().toISOString().split("T")[0];

  const { data: profile } = await supabase
    .from("user_profiles")
    .select("plan")
    .eq("user_id", userId)
    .single();
  const plan = (profile?.plan || "free") as keyof typeof PLAN_LIMITS;
  const limits = PLAN_LIMITS[plan] || PLAN_LIMITS.free;

  const isPremiumModel = (limits as any).premiumModels?.includes(model);

  // Use RPC or custom logic to increment both counts safely
  const { data: usage } = await supabase
    .from("daily_usage")
    .select("message_count, premium_count")
    .eq("user_id", userId)
    .eq("date", today)
    .single();

  const currentMessageCount = usage?.message_count || 0;
  const currentPremiumCount = usage?.premium_count || 0;

  await supabase.from("daily_usage").upsert(
    {
      user_id: userId,
      date: today,
      message_count: currentMessageCount + 1,
      premium_count: isPremiumModel ? currentPremiumCount + 1 : currentPremiumCount,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "user_id,date" }
  );
}
