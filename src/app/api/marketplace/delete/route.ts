import { auth } from "@/lib/auth/client"
import { NextResponse } from "next/server"
import { deleteListing } from "@/server/db/misc"

// DELETE /api/marketplace/delete  body: { listingId }
export async function DELETE(req: Request) {
  try {
    const { userId } = await auth()
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const { listingId } = await req.json()
    if (!listingId) return NextResponse.json({ error: "listingId required" }, { status: 400 })

    await deleteListing(listingId)
    return NextResponse.json({ success: true })
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 500 })
  }
}
