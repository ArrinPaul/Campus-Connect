import { auth } from "@/lib/auth/client"
import { NextResponse } from "next/server"
import { isBookmarked } from "@/server/db/bookmarks"

// GET /api/bookmarks/check?postId=...
export async function GET(req: Request) {
  try {
    const { userId } = await auth()
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const { searchParams } = new URL(req.url)
    const postId = searchParams.get("postId")
    if (!postId) return NextResponse.json({ error: "postId required" }, { status: 400 })

    const bookmarked = await isBookmarked(userId, postId)
    return NextResponse.json({ isBookmarked: bookmarked })
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 500 })
  }
}

