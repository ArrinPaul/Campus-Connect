import { createClient } from "@/lib/supabase/server"
import { internalError } from "@/lib/api-error"
import { NextResponse } from "next/server"
import { respondToInvite } from "@/server/db/communities"

// POST /api/communities/invite  body: { inviteId, status: "accepted" | "declined" }
export async function POST(req: Request) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    const userId = user?.id
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const { inviteId, status } = await req.json()
    if (!inviteId || !status) {
      return NextResponse.json({ error: "inviteId and status required" }, { status: 400 })
    }
    if (status !== "accepted" && status !== "declined") {
      return NextResponse.json({ error: "status must be 'accepted' or 'declined'" }, { status: 400 })
    }

    await respondToInvite(inviteId, status)
    return NextResponse.json({ success: true })
  } catch (err) {
    return internalError(err)
  }
}