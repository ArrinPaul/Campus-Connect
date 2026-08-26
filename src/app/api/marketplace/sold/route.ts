import { createClient } from "@/lib/supabase/server"
import { internalError } from "@/lib/api-error"
import { NextResponse } from "next/server"
import { updateListing } from "@/server/db/misc"

// POST /api/marketplace/sold  body: { listingId }
export async function POST(req: Request) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    const userId = user?.id
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const body = await req.json().catch(() => ({}))
    const listingId = body.listingId || body.id
    if (!listingId) return NextResponse.json({ error: "listingId required" }, { status: 400 })

    const result = await updateListing(listingId, userId, { status: "sold" })
    if ("error" in result) {
      return NextResponse.json({ error: result.error }, { status: result.status })
    }

    return NextResponse.json({ success: true, listing: result.data })
  } catch (err) {
    return internalError(err)
  }
}
