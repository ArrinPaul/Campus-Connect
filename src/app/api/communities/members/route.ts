import { createClient } from "@/lib/supabase/server"
import { internalError } from "@/lib/api-error"
import { NextResponse } from "next/server"
import { getCommunityMembers, inviteMember } from "@/server/db/communities"

// GET /api/communities/members?communityId=...
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url)
    const communityId = searchParams.get("communityId")
    if (!communityId) return NextResponse.json({ error: "communityId required" }, { status: 400 })

    const result = await getCommunityMembers(communityId)
    return NextResponse.json(result)
  } catch (err) {
    return internalError(err)
  }
}

// POST /api/communities/members  body: { communityId, userId }
export async function POST(req: Request) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    const userId = user?.id
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const { communityId, userId: inviteeId } = await req.json()
    if (!communityId || !inviteeId) {
      return NextResponse.json({ error: "communityId and userId required" }, { status: 400 })
    }

    await inviteMember(communityId, userId, inviteeId)
    return NextResponse.json({ success: true })
  } catch (err) {
    return internalError(err)
  }
}
