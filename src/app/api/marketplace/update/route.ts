import { createClient } from "@/lib/supabase/server"
import { internalError } from "@/lib/api-error"
import { NextResponse } from "next/server"
import { updateListing } from "@/server/db/misc"

// POST or PATCH /api/marketplace/update
export async function POST(req: Request) {
  return handleUpdate(req)
}

export async function PATCH(req: Request) {
  return handleUpdate(req)
}

async function handleUpdate(req: Request) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    const userId = user?.id
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const body = await req.json().catch(() => ({}))
    const listingId = body.id || body.listingId || body.listing_id

    if (!listingId) {
      return NextResponse.json({ error: "listingId is required" }, { status: 400 })
    }

    const { id, listingId: _lid, listing_id: _l_id, ...updates } = body
    const result = await updateListing(listingId, userId, updates)

    if ("error" in result) {
      return NextResponse.json({ error: result.error }, { status: result.status })
    }

    return NextResponse.json(result.data)
  } catch (err) {
    return internalError(err)
  }
}
