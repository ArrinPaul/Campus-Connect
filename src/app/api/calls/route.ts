import { auth } from "@clerk/nextjs/server"
import { NextResponse } from "next/server"
import { initiateCall, updateCallStatus, getIncomingCall } from "@/server/db/misc"
import { requireDbUser } from "@/server/db/client"

// GET /api/calls/incoming
export async function GET() {
  try {
    const { userId: clerkId } = await auth()
    if (!clerkId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const me = await requireDbUser(clerkId)
    const call = await getIncomingCall(me.id as string)
    return NextResponse.json(call)
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 500 })
  }
}

// POST /api/calls  body: { recipientId, type }
export async function POST(req: Request) {
  try {
    const { userId: clerkId } = await auth()
    if (!clerkId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const me = await requireDbUser(clerkId)
    const { recipientId, type } = await req.json()
    if (!recipientId) return NextResponse.json({ error: "recipientId required" }, { status: 400 })

    const call = await initiateCall(me.id as string, recipientId, type ?? "video")
    return NextResponse.json(call)
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 500 })
  }
}
