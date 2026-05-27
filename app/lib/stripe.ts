import Stripe from "stripe";

let stripeInstance: Stripe | null = null;

export function getStripe(): Stripe {
  if (stripeInstance) return stripeInstance;

  const secretKey = process.env.STRIPE_SECRET_KEY;
  if (!secretKey) {
    throw new Error("[Stripe] STRIPE_SECRET_KEY is not configured");
  }

  stripeInstance = new Stripe(secretKey, {
    apiVersion: "2025-02-24.acacia",
    typescript: true,
  });

  return stripeInstance;
}

// Stripe configuration
export const STRIPE_CONFIG = {
  proPriceId:
    (process.env.STRIPE_PRO_PRICE_ID || "price_1TaW5FALxcZaZQ5ArpasiT32").trim(),
  proProductId: (process.env.STRIPE_PRO_PRODUCT_ID || "prod_UZfPfFfluHdBnL").trim(),
  webhookSecret: (process.env.STRIPE_WEBHOOK_SECRET || "").trim(),
};

// Plan limits
export const PLAN_LIMITS = {
  free: {
    messagesPerDay: 20,
    models: ["deepseek-chat", "gpt-4o-mini", "gemini-2.5-flash"],
  },
  pro: {
    messagesPerDay: 200, // Fair Use Limit
    premiumModelLimit: 50, // Limit for GPT-4o, Gemini Pro, etc.
    models: [
      "deepseek-chat",
      "deepseek-reasoner",
      "gpt-4o",
      "gpt-4o-mini",
      "gemini-2.5-flash",
      "gemini-2.5-pro",
    ],
    premiumModels: ["gpt-4o", "gemini-2.5-pro", "deepseek-reasoner"],
  },
};
