import { NextResponse } from "next/server"
import { getByTag, searchHashtags } from "@/server/db/hashtags"

// GET /api/hashtags?tag=...  OR  /api/hashtags?q=...
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url)
    const tag = searchParams.get("tag")
    const q = searchParams.get("q")

    if (q) {
      const results = await searchHashtags(q)
      return NextResponse.json(results)
    }

    if (!tag) return NextResponse.json({ error: "tag or q required" }, { status: 400 })
    const hashtag = await getByTag(tag)
    if (!hashtag) return NextResponse.json({ error: "Not found" }, { status: 404 })
    return NextResponse.json(hashtag)
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 500 })
  }
}
