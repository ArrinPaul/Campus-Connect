import { NextResponse } from "next/server"

// GET /api/subscriptions — stub; integrate with Stripe if needed
export async function GET() {
  return NextResponse.json({ status: "free", plan: null })
}
