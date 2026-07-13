import { NextResponse } from "next/server"
import { internalError } from "@/lib/api-error"
import { trackAdClick } from "@/server/db/misc"

// POST /api/ads/click  body: { adId }
export async function POST(req: Request) {
  try {
    const { adId } = await req.json()
    if (!adId) return NextResponse.json({ error: "adId required" }, { status: 400 })

    await trackAdClick(adId)
    return NextResponse.json({ success: true })
  } catch (err) {
    return internalError(err)
  }
}
