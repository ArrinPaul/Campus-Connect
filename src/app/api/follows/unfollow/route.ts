import { createClient } from "@/lib/supabase/server"
import { internalError } from "@/lib/api-error"
import { NextResponse } from "next/server"
import { unfollowUser } from "@/server/db/follows"

// DELETE /api/follows/unfollow  body: { userId } or query param ?userId=...
export async function DELETE(req: Request) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    const authId = user?.id
    if (!authId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const url = new URL(req.url)
    const body = await req.json().catch(() => ({}))
    const targetUserId = body.userId || body.targetUserId || body.followeeId || body.id || url.searchParams.get("userId")
    if (!targetUserId) return NextResponse.json({ error: "userId required" }, { status: 400 })

    await unfollowUser(authId, targetUserId)
    return NextResponse.json({ success: true, isFollowing: false })
  } catch (err) {
    return internalError(err)
  }
}
