import { createClient } from "@/lib/supabase/server"
import { internalError } from "@/lib/api-error"
import { NextResponse } from "next/server"
import { respondToInvite } from "@/server/db/communities"

// POST /api/communities/invite/respond  body: { inviteId, status: "accepted" | "declined" }
export async function POST(req: Request) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const body = await req.json().catch(() => ({}))
    const { inviteId, status } = body
    if (!inviteId || (status !== "accepted" && status !== "declined")) {
      return NextResponse.json({ error: "inviteId and a valid status ('accepted'|'declined') are required" }, { status: 400 })
    }

    // Only the invitee may respond to their own invite.
    const { data: invite } = await supabase.from("community_invites").select("invitee_id").eq("id", inviteId).single()
    if (!invite) return NextResponse.json({ error: "Invite not found" }, { status: 404 })
    if (invite.invitee_id !== user.id) return NextResponse.json({ error: "Forbidden" }, { status: 403 })

    await respondToInvite(inviteId, status)
    return NextResponse.json({ success: true })
  } catch (err) {
    return internalError(err)
  }
}
