import { NextResponse } from "next/server"
import { internalError } from "@/lib/api-error"
import { getTrendingHashtags } from "@/server/db/hashtags"

// GET /api/hashtags/trending?limit=...
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url)
    const limit = Number(searchParams.get("limit") ?? "10")

    const trending = await getTrendingHashtags(limit)
    return NextResponse.json(trending)
  } catch (err) {
    return internalError(err)
  }
}
