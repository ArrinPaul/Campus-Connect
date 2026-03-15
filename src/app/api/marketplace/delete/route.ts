import { auth } from "@clerk/nextjs/server"
import { NextResponse } from "next/server"
import { deleteListing } from "@/server/db/misc"
import { requireDbUser } from "@/server/db/client"

// DELETE /api/marketplace/delete  body: { listingId }
export async function DELETE(req: Request) {
  try {
    const { userId: clerkId } = await auth()
    if (!clerkId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const { listingId } = await req.json()
    if (!listingId) return NextResponse.json({ error: "listingId required" }, { status: 400 })

    const me = await requireDbUser(clerkId)
    await deleteListing(listingId, me.id as string)
    return NextResponse.json({ success: true })
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 500 })
  }
}
