import { NextRequest, NextResponse } from "next/server";
import { getSupabase } from "@/app/lib/supabase";

export async function POST(req: NextRequest) {
  try {
    const { userId, email } = await req.json();

    if (!email) {
      return NextResponse.json({ error: true, msg: "Email is required" }, { status: 400 });
    }

    const supabase = getSupabase();

    // Check if already in waitlist
    const { data: existing } = await supabase
      .from("waitlist")
      .select("*")
      .eq("email", email)
      .single();

    if (existing) {
      return NextResponse.json({ success: true, msg: "Already in waitlist" });
    }

    // Insert into waitlist
    const { error } = await supabase
      .from("waitlist")
      .insert([{ user_id: userId, email }]);

    if (error) {
      console.error("[Waitlist API] insert error:", error);
      return NextResponse.json({ error: true, msg: "Failed to join waitlist" }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (e) {
    console.error("[Waitlist API] error:", e);
    return NextResponse.json({ error: true, msg: "Internal server error" }, { status: 500 });
  }
}
