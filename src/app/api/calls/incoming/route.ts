import { auth } from "@/lib/auth/server"
import { NextResponse } from "next/server"
import { getIncomingCall } from "@/server/db/misc"

// GET /api/calls/incoming
export async function GET() {
  try {
    const { userId } = await auth()
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const call = await getIncomingCall(userId)
    return NextResponse.json(call)
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 500 })
  }
}