import { auth } from "@/lib/auth/server"
import { NextResponse } from "next/server"
import { updateListing } from "@/server/db/misc"
import { requireDbUser } from "@/server/db/client"

// PATCH /api/marketplace/update  body: { listingId, ...fields }
export async function PATCH(req: Request) {
  try {
    const { userId: clerkId } = await auth()
    if (!clerkId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const { listingId, ...updates } = await req.json()
    if (!listingId) return NextResponse.json({ error: "listingId required" }, { status: 400 })

    const me = await requireDbUser(clerkId)
    const listing = await updateListing(listingId, me.id as string, updates)
    return NextResponse.json(listing)
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 500 })
  }
}
