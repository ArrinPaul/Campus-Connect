import { auth } from "@/lib/auth/server"
import { NextResponse } from "next/server"
import { leaveCommunity } from "@/server/db/communities"
import { requireDbUser } from "@/server/db/client"

// POST /api/communities/leave  body: { communityId }
export async function POST(req: Request) {
  try {
    const { userId: clerkId } = await auth()
    if (!clerkId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const { communityId } = await req.json()
    if (!communityId) return NextResponse.json({ error: "communityId required" }, { status: 400 })

    const me = await requireDbUser(clerkId)
    await leaveCommunity(communityId, me.id as string)
    return NextResponse.json({ success: true })
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 500 })
  }
}
