import { createClient } from "@/lib/supabase/server"
import { internalError } from "@/lib/api-error"
import { NextResponse } from "next/server"
import { deleteListing } from "@/server/db/misc"

// POST or DELETE /api/marketplace/delete
export async function POST(req: Request) {
  return handleDelete(req)
}

export async function DELETE(req: Request) {
  return handleDelete(req)
}

async function handleDelete(req: Request) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    const userId = user?.id
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const body = await req.json().catch(() => ({}))
    const { searchParams } = new URL(req.url)
    const listingId = body.id || body.listingId || body.listing_id || searchParams.get("id")

    if (!listingId) {
      return NextResponse.json({ error: "listingId is required" }, { status: 400 })
    }

    const result = await deleteListing(listingId, userId)
    if ("error" in result) {
      return NextResponse.json({ error: result.error }, { status: result.status })
    }

    return NextResponse.json({ success: true, id: listingId })
  } catch (err) {
    return internalError(err)
  }
}
