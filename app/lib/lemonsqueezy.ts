import crypto from "crypto";

export interface LemonSqueezyConfig {
  apiKey: string;
  storeId: string;
  variantId: string;
  webhookSecret: string;
}

export const LEMON_SQUEEZY_CONFIG: LemonSqueezyConfig = {
  apiKey: (process.env.LEMON_SQUEEZY_API_KEY || "").trim(),
  storeId: (process.env.LEMON_SQUEEZY_STORE_ID || "").trim(),
  variantId: (process.env.LEMON_SQUEEZY_VARIANT_ID || "").trim(),
  webhookSecret: (process.env.LEMON_SQUEEZY_WEBHOOK_SECRET || "").trim(),
};

/**
 * Verify Lemon Squeezy webhook signature
 */
export function verifySignature(body: string, signature: string, secret: string): boolean {
  const hmac = crypto.createHmac("sha256", secret);
  const digest = Buffer.from(hmac.update(body).digest("hex"), "utf8");
  const signatureBuffer = Buffer.from(signature, "hex");

  if (digest.length !== signatureBuffer.length) {
    return false;
  }

  return crypto.timingSafeEqual(digest, signatureBuffer);
}

/**
 * Create a checkout session via Lemon Squeezy API
 */
export async function createCheckout(userId: string, userEmail: string) {
  if (!LEMON_SQUEEZY_CONFIG.apiKey || !LEMON_SQUEEZY_CONFIG.storeId || !LEMON_SQUEEZY_CONFIG.variantId) {
    throw new Error("[Lemon Squeezy] API Key, Store ID, or Variant ID is not configured");
  }

  const response = await fetch("https://api.lemonsqueezy.com/v1/checkouts", {
    method: "POST",
    headers: {
      Accept: "application/vnd.api+json",
      "Content-Type": "application/vnd.api+json",
      Authorization: `Bearer ${LEMON_SQUEEZY_CONFIG.apiKey}`,
    },
    body: JSON.stringify({
      data: {
        type: "checkouts",
        attributes: {
          checkout_data: {
            email: userEmail,
            custom: {
              user_id: userId,
            },
          },
        },
        relationships: {
          store: {
            data: {
              type: "stores",
              id: LEMON_SQUEEZY_CONFIG.storeId,
            },
          },
          variant: {
            data: {
              type: "variants",
              id: LEMON_SQUEEZY_CONFIG.variantId,
            },
          },
        },
      },
    }),
  });

  const data = await response.json();
  if (!response.ok) {
    console.error("[Lemon Squeezy] API Error:", data);
    throw new Error(data.errors?.[0]?.detail || "Failed to create checkout");
  }

  return data.data.attributes.url;
}
