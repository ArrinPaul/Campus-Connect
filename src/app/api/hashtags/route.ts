import { NextResponse } from "next/server"
import { internalError } from "@/lib/api-error"
import { searchHashtags } from "@/server/db/hashtags"

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
    const results = await searchHashtags(tag)
    if (!results.length) return NextResponse.json({ error: "Not found" }, { status: 404 })
    return NextResponse.json(results[0])
  } catch (err) {
    return internalError(err)
  }
}
