import { internalError } from "@/lib/api-error"
import { NextResponse } from "next/server"
import { searchHashtags } from "@/server/db/hashtags"

// GET /api/hashtags/search?q=...&limit=10
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url)
    const query = searchParams.get("q") ?? searchParams.get("query") ?? ""
    if (!query.trim()) return NextResponse.json({ hashtags: [] })

    const limit = parseInt(searchParams.get("limit") ?? "10")
    const hashtags = await searchHashtags(query, limit)
    return NextResponse.json({ hashtags })
  } catch (err) {
    return internalError(err)
  }
}
