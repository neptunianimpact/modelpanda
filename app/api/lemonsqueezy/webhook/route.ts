import { NextRequest, NextResponse } from "next/server";
import { LEMON_SQUEEZY_CONFIG, verifySignature } from "@/app/lib/lemonsqueezy";
import { createClient } from "@supabase/supabase-js";

export const runtime = "nodejs";

function getSupabaseAdmin() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || "";
  return createClient(supabaseUrl, supabaseServiceKey);
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.text();
    const signature = request.headers.get("x-signature");

    if (!signature) {
      return NextResponse.json({ error: "Missing x-signature header" }, { status: 400 });
    }

    if (LEMON_SQUEEZY_CONFIG.webhookSecret && !verifySignature(body, signature, LEMON_SQUEEZY_CONFIG.webhookSecret)) {
      return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
    }

    const payload = JSON.parse(body);
    const eventName = payload.meta.event_name;
    const attributes = payload.data.attributes;
    const customData = payload.meta.custom_data;
    const userId = customData?.user_id;

    if (!userId) {
      console.error("[Lemon Squeezy Webhook] Missing user_id in custom_data");
      return NextResponse.json({ received: true }); // Still return 200 to LS
    }

    const supabase = getSupabaseAdmin();

    switch (eventName) {
      case "subscription_created":
      case "subscription_updated": {
        const status = attributes.status; // active, trialing, past_due, etc.
        const plan = (status === "active" || status === "trialing") ? "pro" : "free";
        
        await supabase.from("user_profiles").upsert({
          user_id: userId,
          ls_customer_id: attributes.customer_id.toString(),
          ls_subscription_id: payload.data.id.toString(),
          plan: plan,
          subscription_status: status,
          current_period_end: attributes.renews_at,
          updated_at: new Date().toISOString(),
        });
        break;
      }

      case "subscription_cancelled":
      case "subscription_expired": {
        await supabase.from("user_profiles").update({
          plan: "free",
          subscription_status: attributes.status,
          updated_at: new Date().toISOString(),
        }).eq("user_id", userId);
        break;
      }

      case "subscription_payment_failed": {
        await supabase.from("user_profiles").update({
          subscription_status: "past_due",
          updated_at: new Date().toISOString(),
        }).eq("user_id", userId);
        break;
      }

      default:
        console.log(`[Lemon Squeezy Webhook] Unhandled event: ${eventName}`);
    }

    return NextResponse.json({ received: true });
  } catch (error: any) {
    console.error("[Lemon Squeezy Webhook] Error:", error.message);
    return NextResponse.json({ error: "Webhook handler failed" }, { status: 500 });
  }
}
