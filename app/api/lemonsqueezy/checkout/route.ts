import { NextRequest, NextResponse } from "next/server";
import { createCheckout } from "@/app/lib/lemonsqueezy";
import { createClient } from "@supabase/supabase-js";

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

export async function POST(request: NextRequest) {
  try {
    const auth = await verifyAuth(request);
    if (auth.error) {
      return NextResponse.json({ error: auth.error }, { status: 401 });
    }

    const { userId, userEmail } = await request.json();

    if (!userId || !userEmail) {
      return NextResponse.json(
        { error: "Missing userId or userEmail" },
        { status: 400 },
      );
    }

    if (userId !== auth.userId) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const checkoutUrl = await createCheckout(userId, userEmail);
    return NextResponse.json({ url: checkoutUrl });
  } catch (error: any) {
    console.error("[Lemon Squeezy Checkout] Error:", error.message);
    return NextResponse.json(
      { error: error.message || "Failed to create checkout session" },
      { status: 500 },
    );
  }
}
