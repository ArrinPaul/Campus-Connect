import { auth } from "@/lib/auth/server"
import { NextResponse } from "next/server"
import { isBookmarked } from "@/server/db/bookmarks"
import { requireDbUser } from "@/server/db/client"

// GET /api/bookmarks/check?postId=...
export async function GET(req: Request) {
  try {
    const { userId: clerkId } = await auth()
    if (!clerkId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const { searchParams } = new URL(req.url)
    const postId = searchParams.get("postId")
    if (!postId) return NextResponse.json({ error: "postId required" }, { status: 400 })

    const me = await requireDbUser(clerkId)
    const bookmarked = await isBookmarked(me.id as string, postId)
    return NextResponse.json({ isBookmarked: bookmarked })
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 500 })
  }
}
