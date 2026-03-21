import { NextResponse } from "next/server"
import { getCommunityMembers } from "@/server/db/communities"

// GET /api/communities/members?communityId=...&limit=...&cursor=...
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url)
    const communityId = searchParams.get("communityId")
    if (!communityId) return NextResponse.json({ error: "communityId required" }, { status: 400 })

    const limit = Number(searchParams.get("limit") ?? "20")
    const result = await getCommunityMembers(communityId, limit)
    return NextResponse.json(result)
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 500 })
  }
}
