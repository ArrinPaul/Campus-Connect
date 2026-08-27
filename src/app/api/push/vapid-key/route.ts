import { NextResponse } from "next/server"

// GET /api/push/vapid-key — Public VAPID key for service worker registration
export async function GET() {
  const publicKey =
    process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY ||
    process.env.VAPID_PUBLIC_KEY ||
    ""

  return NextResponse.json({ publicKey }, { status: 200 })
}