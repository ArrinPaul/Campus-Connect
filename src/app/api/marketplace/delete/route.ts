import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"
import { deleteListing } from "@/server/db/misc"

// DELETE /api/marketplace/delete  body: { listingId }
export async function DELETE(req: Request) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    const userId = user?.id
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const { listingId } = await req.json()
    if (!listingId) return NextResponse.json({ error: "listingId required" }, { status: 400 })

    await deleteListing(listingId)
    return NextResponse.json({ success: true })
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 500 })
  }
}
