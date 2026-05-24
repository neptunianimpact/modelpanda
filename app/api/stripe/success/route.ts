import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  // Redirect to chat with success message
  const origin = request.nextUrl.origin;
  return NextResponse.redirect(`${origin}/#/chat?subscription=success`);
}
