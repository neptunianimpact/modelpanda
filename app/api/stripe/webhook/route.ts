import { NextRequest, NextResponse } from "next/server";
import { getStripe, STRIPE_CONFIG } from "@/app/lib/stripe";
import { createClient } from "@supabase/supabase-js";
import Stripe from "stripe";

// Disable body parsing for webhook signature verification
export const runtime = "nodejs";

function getSupabaseAdmin() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || "";
  return createClient(supabaseUrl, supabaseServiceKey);
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.text();
    const signature = request.headers.get("stripe-signature");

    if (!signature) {
      return NextResponse.json(
        { error: "Missing stripe-signature header" },
        { status: 400 },
      );
    }

    const stripe = getStripe();
    let event: Stripe.Event;

    // Verify webhook signature
    try {
      if (STRIPE_CONFIG.webhookSecret) {
        event = stripe.webhooks.constructEvent(
          body,
          signature,
          STRIPE_CONFIG.webhookSecret,
        );
      } else {
        // In development, parse without verification
        event = JSON.parse(body) as Stripe.Event;
      }
    } catch (err: any) {
      console.error("[Stripe Webhook] Signature verification failed:", err.message);
      return NextResponse.json(
        { error: "Webhook signature verification failed" },
        { status: 400 },
      );
    }

    const supabase = getSupabaseAdmin();

    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        const userId = session.metadata?.supabase_user_id;
        const subscriptionId = session.subscription as string;

        if (userId && subscriptionId) {
          await supabase.from("user_profiles").upsert({
            user_id: userId,
            stripe_customer_id: session.customer as string,
            stripe_subscription_id: subscriptionId,
            plan: "pro",
            subscription_status: "active",
            updated_at: new Date().toISOString(),
          });
        }
        break;
      }

      case "customer.subscription.updated": {
        const subscription = event.data.object as Stripe.Subscription;
        const userId = subscription.metadata?.supabase_user_id;

        if (userId) {
          const status = subscription.status;
          const plan =
            status === "active" || status === "trialing" ? "pro" : "free";

          await supabase
            .from("user_profiles")
            .update({
              plan: plan,
              subscription_status: status,
              current_period_end: subscription.current_period_end
                ? new Date(
                    subscription.current_period_end * 1000,
                  ).toISOString()
                : null,
              updated_at: new Date().toISOString(),
            })
            .eq("user_id", userId);
        }
        break;
      }

      case "customer.subscription.deleted": {
        const subscription = event.data.object as Stripe.Subscription;
        const userId = subscription.metadata?.supabase_user_id;

        if (userId) {
          await supabase
            .from("user_profiles")
            .update({
              plan: "free",
              subscription_status: "canceled",
              stripe_subscription_id: null,
              updated_at: new Date().toISOString(),
            })
            .eq("user_id", userId);
        }
        break;
      }

      case "invoice.payment_failed": {
        const invoice = event.data.object as Stripe.Invoice;
        const subscriptionId = invoice.subscription as string;

        if (subscriptionId) {
          // Find user by subscription ID
          const { data: profile } = await supabase
            .from("user_profiles")
            .select("user_id")
            .eq("stripe_subscription_id", subscriptionId)
            .single();

          if (profile) {
            await supabase
              .from("user_profiles")
              .update({
                subscription_status: "past_due",
                updated_at: new Date().toISOString(),
              })
              .eq("user_id", profile.user_id);
          }
        }
        break;
      }

      default:
        console.log(`[Stripe Webhook] Unhandled event type: ${event.type}`);
    }

    return NextResponse.json({ received: true });
  } catch (error: any) {
    console.error("[Stripe Webhook] Error:", error.message);
    return NextResponse.json(
      { error: "Webhook handler failed" },
      { status: 500 },
    );
  }
}
