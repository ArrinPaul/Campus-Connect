import { auth } from "@/lib/auth/client"
import { NextResponse } from "next/server"
import { updateListing } from "@/server/db/misc"

// PATCH /api/marketplace/update  body: { listingId, ...fields }
export async function PATCH(req: Request) {
  try {
    const { userId } = await auth()
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const { listingId, ...updates } = await req.json()
    if (!listingId) return NextResponse.json({ error: "listingId required" }, { status: 400 })

    const listing = await updateListing(listingId, updates)
    return NextResponse.json(listing)
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 500 })
  }
}
