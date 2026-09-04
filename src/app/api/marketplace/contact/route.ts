import { createClient } from "@/lib/supabase/server"
import { internalError } from "@/lib/api-error"
import { NextResponse } from "next/server"
import { getListingById } from "@/server/db/misc"
import { getOrCreateDMConversation, sendMessage } from "@/server/db/messages"

// POST /api/marketplace/contact  body: { listingId, message? }
// Opens (or reuses) a DM conversation with the listing's seller and,
// optionally, sends an opening message referencing the listing.
export async function POST(req: Request) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    const userId = user?.id
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const body = await req.json().catch(() => ({}))
    const listingId = body.listingId || body.id
    const message = typeof body.message === "string" ? body.message.trim() : ""
    if (!listingId) return NextResponse.json({ error: "listingId is required" }, { status: 400 })

    const listing = await getListingById(listingId)
    if (!listing) return NextResponse.json({ error: "Listing not found" }, { status: 404 })
    const sellerId = listing.posted_by
    if (!sellerId) return NextResponse.json({ error: "Listing has no seller" }, { status: 500 })
    if (sellerId === userId) return NextResponse.json({ error: "You cannot contact yourself about your own listing" }, { status: 400 })

    const conversation = await getOrCreateDMConversation(userId, sellerId)
    if (!conversation) return NextResponse.json({ error: "Failed to open conversation" }, { status: 500 })

    const content = message || `Hi, I'm interested in "${listing.title ?? "your listing"}".`
    const sent = await sendMessage({ conversation_id: conversation.id, sender_id: userId, content })

    return NextResponse.json({ conversation, message: sent }, { status: 201 })
  } catch (err) {
    return internalError(err)
  }
}
