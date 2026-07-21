import { createClient } from "@/lib/supabase/server"
import { internalError } from "@/lib/api-error"
import { NextResponse } from "next/server"
import { addBookmark, getBookmarks } from "@/server/db/bookmarks"

// GET /api/bookmarks?limit=...&cursor=...
export async function GET(req: Request) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    const userId = user?.id
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const { searchParams } = new URL(req.url)
    const limit = Number(searchParams.get("limit") ?? "20")
    const offset = Number(searchParams.get("offset") ?? "0")

    const result = await getBookmarks(userId, limit, offset)
    return NextResponse.json(result)
  } catch (err) {
    return internalError(err)
  }
}

// POST /api/bookmarks  body: { postId, collection? }
export async function POST(req: Request) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    const userId = user?.id
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const body = await req.json().catch(() => ({}))
    const { postId, collection } = body
    if (!postId) return NextResponse.json({ error: "postId required" }, { status: 400 })

    await addBookmark(userId, postId, collection)
    return NextResponse.json({ success: true })
  } catch (err) {
    return internalError(err)
  }
}
