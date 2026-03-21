import { auth } from "@/lib/auth/server"
import { NextResponse } from "next/server"
import { markAsSold } from "@/server/db/misc"
import { requireDbUser } from "@/server/db/client"

// POST /api/marketplace/sold  body: { listingId }
export async function POST(req: Request) {
  try {
    const { userId: clerkId } = await auth()
    if (!clerkId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const { listingId } = await req.json()
    if (!listingId) return NextResponse.json({ error: "listingId required" }, { status: 400 })

    const me = await requireDbUser(clerkId)
    await markAsSold(listingId, me.id as string)
    return NextResponse.json({ success: true })
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 500 })
  }
}
