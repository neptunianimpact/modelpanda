import { NextRequest, NextResponse } from "next/server";
import { getStripe } from "@/app/lib/stripe";
import { createClient } from "@supabase/supabase-js";

function getSupabaseAdmin() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
  const supabaseServiceKey = (
    process.env.SUPABASE_SERVICE_ROLE_KEY || ""
  ).trim();
  return createClient(supabaseUrl, supabaseServiceKey);
}

export async function GET(request: NextRequest) {
  const origin = request.nextUrl.origin;
  const sessionId = request.nextUrl.searchParams.get("session_id");

  if (!sessionId) {
    return NextResponse.redirect(`${origin}/#/pricing?error=missing_session`);
  }

  try {
    const stripe = getStripe();

    // Retrieve the checkout session from Stripe
    const session = await stripe.checkout.sessions.retrieve(sessionId, {
      expand: ["subscription"],
    });

    if (session.payment_status === "paid" && session.metadata?.supabase_user_id) {
      const userId = session.metadata.supabase_user_id;
      const subscriptionId =
        typeof session.subscription === "string"
          ? session.subscription
          : (session.subscription as any)?.id;

      const supabase = getSupabaseAdmin();

      // Update user profile to Pro
      await supabase.from("user_profiles").upsert(
        {
          user_id: userId,
          stripe_customer_id: session.customer as string,
          stripe_subscription_id: subscriptionId,
          plan: "pro",
          subscription_status: "active",
          updated_at: new Date().toISOString(),
        },
        { onConflict: "user_id" },
      );

      console.log(
        `[Stripe Success] User ${userId} upgraded to Pro, subscription: ${subscriptionId}`,
      );
    }

    return NextResponse.redirect(`${origin}/#/pricing?subscription=success`);
  } catch (error: any) {
    console.error("[Stripe Success] Error:", error.message);
    return NextResponse.redirect(`${origin}/#/pricing?subscription=success`);
  }
}
