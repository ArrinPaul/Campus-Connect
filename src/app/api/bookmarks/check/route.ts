import { createClient } from "@/lib/supabase/server"
import { internalError } from "@/lib/api-error"
import { NextResponse } from "next/server"
import { isBookmarked } from "@/server/db/bookmarks"

// GET /api/bookmarks/check?postId=...
export async function GET(req: Request) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    const userId = user?.id
    if (!userId) return NextResponse.json({ isBookmarked: false })

    const { searchParams } = new URL(req.url)
    const postId = searchParams.get("postId")
    if (!postId) return NextResponse.json({ isBookmarked: false })

    const bookmarked = await isBookmarked(userId, postId)
    return NextResponse.json({ isBookmarked: bookmarked })
  } catch (err) {
    return internalError(err)
  }
}
