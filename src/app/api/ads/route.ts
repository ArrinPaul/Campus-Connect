import { auth } from "@/lib/auth/server"
import { NextResponse } from "next/server"
import { getActiveAds, createAd, trackAdImpression, trackAdClick, getAdDashboard } from "@/server/db/misc"
import { requireDbUser } from "@/server/db/client"

// GET /api/ads?placement=...
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url)
    const placement = searchParams.get("placement") ?? undefined

    const ads = await getActiveAds(placement)
    return NextResponse.json(ads)
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 500 })
  }
}

// POST /api/ads  body: ad data
export async function POST(req: Request) {
  try {
    const { userId: clerkId } = await auth()
    if (!clerkId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const me = await requireDbUser(clerkId)
    const body = await req.json()
    const ad = await createAd(me.id as string, body)
    return NextResponse.json(ad)
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 500 })
  }
}
