import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { getStripe } from "@/app/lib/stripe";

function getSupabaseAdmin() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || "";
  return createClient(supabaseUrl, supabaseServiceKey);
}

// GET - Get user subscription status
export async function GET(request: NextRequest) {
  try {
    const userId = request.nextUrl.searchParams.get("userId");
    if (!userId) {
      return NextResponse.json({ error: "Missing userId" }, { status: 400 });
    }

    const supabase = getSupabaseAdmin();
    const { data: profile, error } = await supabase
      .from("user_profiles")
      .select("*")
      .eq("user_id", userId)
      .single();

    if (error || !profile) {
      // Return free plan for users without a profile
      return NextResponse.json({
        plan: "free",
        subscription_status: null,
        current_period_end: null,
      });
    }

    return NextResponse.json({
      plan: profile.plan || "free",
      subscription_status: profile.subscription_status,
      current_period_end: profile.current_period_end,
      stripe_customer_id: profile.stripe_customer_id,
    });
  } catch (error: any) {
    console.error("[Subscription] Error:", error.message);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// DELETE - Cancel subscription
export async function DELETE(request: NextRequest) {
  try {
    const { userId } = await request.json();
    if (!userId) {
      return NextResponse.json({ error: "Missing userId" }, { status: 400 });
    }

    const supabase = getSupabaseAdmin();
    const { data: profile } = await supabase
      .from("user_profiles")
      .select("stripe_subscription_id")
      .eq("user_id", userId)
      .single();

    if (!profile?.stripe_subscription_id) {
      return NextResponse.json(
        { error: "No active subscription found" },
        { status: 404 },
      );
    }

    const stripe = getStripe();

    // Cancel at period end (user keeps access until end of billing period)
    await stripe.subscriptions.update(profile.stripe_subscription_id, {
      cancel_at_period_end: true,
    });

    await supabase
      .from("user_profiles")
      .update({
        subscription_status: "canceling",
        updated_at: new Date().toISOString(),
      })
      .eq("user_id", userId);

    return NextResponse.json({ success: true, message: "Subscription will be canceled at period end" });
  } catch (error: any) {
    console.error("[Subscription Cancel] Error:", error.message);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
