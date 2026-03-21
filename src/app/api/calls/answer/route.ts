import { auth } from "@/lib/auth/server"
import { NextResponse } from "next/server"
import { updateCallStatus } from "@/server/db/misc"
import { requireDbUser } from "@/server/db/client"

// POST /api/calls/answer  body: { callId }
export async function POST(req: Request) {
  try {
    const { userId: authId } = await auth()
    if (!authId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const { callId } = await req.json()
    if (!callId) return NextResponse.json({ error: "callId required" }, { status: 400 })

    await requireDbUser(authId)
    await updateCallStatus(callId, "active")
    return NextResponse.json({ success: true })
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 500 })
  }
}

