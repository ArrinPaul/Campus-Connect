import { auth } from "@/lib/auth/server"
import { NextResponse } from "next/server"
import { addBookmark, getBookmarks } from "@/server/db/bookmarks"

// GET /api/bookmarks?limit=...&cursor=...
export async function GET(req: Request) {
  try {
    const { userId } = await auth()
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const { searchParams } = new URL(req.url)
    const limit = Number(searchParams.get("limit") ?? "20")
    const offset = Number(searchParams.get("offset") ?? "0")

    const result = await getBookmarks(userId, limit, offset)
    return NextResponse.json(result)
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 500 })
  }
}

// POST /api/bookmarks  body: { postId, collection? }
export async function POST(req: Request) {
  try {
    const { userId } = await auth()
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const { postId, collection } = await req.json()
    if (!postId) return NextResponse.json({ error: "postId required" }, { status: 400 })

    await addBookmark(userId, postId, collection)
    return NextResponse.json({ success: true })
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 500 })
  }
}
