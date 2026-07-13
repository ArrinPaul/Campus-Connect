import { NextResponse } from "next/server"
import { internalError } from "@/lib/api-error"
import { getPostsByCommunity } from "@/server/db/posts"

// GET /api/posts/community?communityId=xxx&limit=20&offset=0
export async function GET(req: Request) {
  try {
    const url = new URL(req.url)
    const communityId = url.searchParams.get("communityId")
    if (!communityId) return NextResponse.json({ error: "communityId required" }, { status: 400 })

    const limit = parseInt(url.searchParams.get("limit") ?? "20")
    const offset = parseInt(url.searchParams.get("offset") ?? "0")

    const result = await getPostsByCommunity(communityId, limit, offset)
    return NextResponse.json(result)
  } catch (err) {
    return internalError(err)
  }
}
