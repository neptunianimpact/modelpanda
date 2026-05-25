import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

function getSupabaseAdmin() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || "";
  return createClient(supabaseUrl, supabaseServiceKey);
}

// Verify JWT token and return authenticated user ID
async function verifyAuth(
  request: NextRequest,
): Promise<{ userId: string | null; error: string | null }> {
  const authHeader = request.headers.get("Authorization");
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return { userId: null, error: "Missing or invalid Authorization header" };
  }

  const token = authHeader.replace("Bearer ", "");
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";
  const supabase = createClient(supabaseUrl, supabaseAnonKey);

  const {
    data: { user },
    error,
  } = await supabase.auth.getUser(token);

  if (error || !user) {
    return { userId: null, error: "Invalid or expired token" };
  }

  return { userId: user.id, error: null };
}

// GET - Download chat sessions from cloud
export async function GET(request: NextRequest) {
  try {
    const auth = await verifyAuth(request);
    if (auth.error) {
      return NextResponse.json({ error: auth.error }, { status: 401 });
    }

    const supabase = getSupabaseAdmin();

    // Check if user is Pro
    const { data: profile } = await supabase
      .from("user_profiles")
      .select("plan")
      .eq("user_id", auth.userId)
      .single();

    if (!profile || profile.plan === "free") {
      return NextResponse.json(
        { error: "Cloud sync is a Pro feature" },
        { status: 403 },
      );
    }

    // Get user's synced data
    const { data: syncData, error } = await supabase
      .from("chat_sync")
      .select("sessions_data, version, updated_at")
      .eq("user_id", auth.userId)
      .single();

    if (error && error.code !== "PGRST116") {
      // PGRST116 = no rows found
      console.error("[Sync] Error fetching:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    if (!syncData) {
      return NextResponse.json({
        sessions: [],
        version: 0,
        updatedAt: null,
      });
    }

    return NextResponse.json({
      sessions: syncData.sessions_data,
      version: syncData.version,
      updatedAt: syncData.updated_at,
    });
  } catch (error: any) {
    console.error("[Sync] Error:", error.message);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// POST - Upload chat sessions to cloud
export async function POST(request: NextRequest) {
  try {
    const auth = await verifyAuth(request);
    if (auth.error) {
      return NextResponse.json({ error: auth.error }, { status: 401 });
    }

    const supabase = getSupabaseAdmin();

    // Check if user is Pro
    const { data: profile } = await supabase
      .from("user_profiles")
      .select("plan")
      .eq("user_id", auth.userId)
      .single();

    if (!profile || profile.plan === "free") {
      return NextResponse.json(
        { error: "Cloud sync is a Pro feature" },
        { status: 403 },
      );
    }

    const { sessions, version } = await request.json();

    if (!sessions || !Array.isArray(sessions)) {
      return NextResponse.json(
        { error: "Invalid sessions data" },
        { status: 400 },
      );
    }

    // Upsert the sync data
    const { error } = await supabase.from("chat_sync").upsert(
      {
        user_id: auth.userId,
        sessions_data: sessions,
        version: (version || 0) + 1,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "user_id" },
    );

    if (error) {
      console.error("[Sync] Error upserting:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      version: (version || 0) + 1,
    });
  } catch (error: any) {
    console.error("[Sync] Error:", error.message);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
