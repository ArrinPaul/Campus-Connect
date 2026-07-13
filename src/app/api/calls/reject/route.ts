import { createClient } from "@/lib/supabase/server"
import { internalError } from "@/lib/api-error"
import { NextResponse } from "next/server"
import { updateCallStatus } from "@/server/db/misc"

// POST /api/calls/reject  body: { callId }
export async function POST(req: Request) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    const userId = user?.id
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const { callId } = await req.json()
    if (!callId) return NextResponse.json({ error: "callId required" }, { status: 400 })

    await updateCallStatus(callId, "rejected")
    return NextResponse.json({ success: true })
  } catch (err) {
    return internalError(err)
  }
}

