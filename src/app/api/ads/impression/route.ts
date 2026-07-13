import { NextResponse } from "next/server"
import { internalError } from "@/lib/api-error"
import { trackAdImpression, trackAdClick } from "@/server/db/misc"

// POST /api/ads/impression  body: { adId }
export async function POST(req: Request) {
  try {
    const { adId } = await req.json()
    if (!adId) return NextResponse.json({ error: "adId required" }, { status: 400 })

    await trackAdImpression(adId)
    return NextResponse.json({ success: true })
  } catch (err) {
    return internalError(err)
  }
}
