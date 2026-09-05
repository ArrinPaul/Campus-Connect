import { NextResponse } from "next/server"
import { internalError } from "@/lib/api-error"
import { createClient } from "@/lib/supabase/server"
import { getPostsByHashtag } from "@/server/db/posts"

// GET /api/hashtags/posts?tag=...&limit=&offset=
// Returns { posts, hashtag } — the hashtag page's own tab (# and post
// count header) needs the hashtag row alongside its posts, not just the
// bare post array getPostsByHashtag returns.
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url)
    const tag = searchParams.get("tag")
    if (!tag) return NextResponse.json({ error: "tag required" }, { status: 400 })

    const limit = parseInt(searchParams.get("limit") ?? "20")
    const offset = parseInt(searchParams.get("offset") ?? "0")

    const supabase = await createClient()
    const { data: hashtag } = await supabase.from("hashtags").select("*").eq("tag", tag).maybeSingle()
    // 200, not 404: useQuery (src/lib/api.ts) throws and swallows the
    // response body on a non-2xx status, so the frontend would never be
    // able to tell "no such hashtag" apart from "still loading" if this
    // were a 404. Returning hashtag: null with a 200 lets the page's own
    // `hashtag === null` check actually run.
    if (!hashtag) return NextResponse.json({ posts: [], hashtag: null })

    const posts = await getPostsByHashtag(tag, limit, offset)
    return NextResponse.json({ posts, hashtag })
  } catch (err) {
    return internalError(err)
  }
}
