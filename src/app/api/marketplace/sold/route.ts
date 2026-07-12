import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"
import { updateListing } from "@/server/db/misc"

// POST /api/marketplace/sold  body: { listingId }
export async function POST(req: Request) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    const userId = user?.id
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const { listingId } = await req.json()
    if (!listingId) return NextResponse.json({ error: "listingId required" }, { status: 400 })

    await updateListing(listingId, { status: "sold" })
    return NextResponse.json({ success: true })
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 500 })
  }
}
