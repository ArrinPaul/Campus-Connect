import { createClient } from "@/lib/supabase/server"
import { internalError } from "@/lib/api-error"
import { NextResponse } from "next/server"
import { initiateCall } from "@/server/db/misc"

// POST /api/calls  body: { recipientId, type }
export async function POST(req: Request) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    const userId = user?.id
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const { recipientId, type } = await req.json()
    if (!recipientId) return NextResponse.json({ error: "recipientId required" }, { status: 400 })

    if (recipientId === userId) return NextResponse.json({ error: "You cannot call yourself" }, { status: 400 })
    if (type !== undefined && type !== "audio" && type !== "video") {
      return NextResponse.json({ error: "type must be audio or video" }, { status: 400 })
    }

    const call = await initiateCall(userId, recipientId, type ?? "video")
    if (!call) return NextResponse.json({ error: "Failed to start call" }, { status: 500 })
    // callers read result.callId; the raw row only has id
    return NextResponse.json({ ...call, callId: call.id })
  } catch (err) {
    return internalError(err)
  }
}

