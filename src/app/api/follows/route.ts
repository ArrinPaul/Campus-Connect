import { createClient } from "@/lib/supabase/server"
import { internalError } from "@/lib/api-error"
import { NextResponse } from "next/server"
import { followUser, unfollowUser, isFollowing } from "@/server/db/follows"

// POST /api/follows  body: { userId }
export async function POST(req: Request) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    const authId = user?.id
    if (!authId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const url = new URL(req.url)
    const body = await req.json().catch(() => ({}))
    const targetUserId = body.userId || body.targetUserId || body.followeeId || body.id || url.searchParams.get("userId")
    if (!targetUserId) return NextResponse.json({ error: "userId required" }, { status: 400 })

    await followUser(authId, targetUserId)
    return NextResponse.json({ success: true, isFollowing: true })
  } catch (err) {
    return internalError(err)
  }
}

// GET /api/follows?userId=xxx
export async function GET(req: Request) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    const authId = user?.id
    const url = new URL(req.url)
    const targetUserId = url.searchParams.get("userId")

    if (targetUserId && authId) {
      const following = await isFollowing(authId, targetUserId)
      return NextResponse.json({ isFollowing: following })
    }
    return NextResponse.json({ isFollowing: false })
  } catch (err) {
    return internalError(err)
  }
}
