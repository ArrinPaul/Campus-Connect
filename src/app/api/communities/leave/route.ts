import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"
import { leaveCommunity } from "@/server/db/communities"

// POST /api/communities/leave  body: { communityId }
export async function POST(req: Request) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    const userId = user?.id
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const { communityId } = await req.json()
    if (!communityId) return NextResponse.json({ error: "communityId required" }, { status: 400 })

    await leaveCommunity(communityId, userId)
    return NextResponse.json({ success: true })
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 500 })
  }
}

