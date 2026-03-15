import { auth } from "@clerk/nextjs/server"
import { NextResponse } from "next/server"
import { getBookmarkCollections } from "@/server/db/bookmarks"
import { requireDbUser } from "@/server/db/client"

// GET /api/bookmarks/collections
export async function GET() {
  try {
    const { userId: clerkId } = await auth()
    if (!clerkId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const me = await requireDbUser(clerkId)
    const collections = await getBookmarkCollections(me.id as string)
    return NextResponse.json(collections)
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 500 })
  }
}
