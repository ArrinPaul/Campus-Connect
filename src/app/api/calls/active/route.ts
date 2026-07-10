import { auth } from "@/lib/auth/client"
import { NextResponse } from "next/server"
import { getActiveCalls } from "@/server/db/misc"

// GET /api/calls/active
export async function GET() {
  try {
    const { userId } = await auth()
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const calls = await getActiveCalls(userId)
    return NextResponse.json(calls)
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 500 })
  }
}