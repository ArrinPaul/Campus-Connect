import { auth } from "@/lib/auth/server"
import { NextResponse } from "next/server"
import { updatePresence, getUserStatuses } from "@/server/db/misc"
import { requireDbUser } from "@/server/db/client"

// GET /api/presence?userIds=...
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url)
    const userIdsStr = searchParams.get("userIds")
    if (!userIdsStr) return NextResponse.json({ error: "userIds required" }, { status: 400 })

    const userIds = userIdsStr.split(",").filter(Boolean)
    const statuses = await getUserStatuses(userIds)
    return NextResponse.json(statuses)
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 500 })
  }
}

// POST /api/presence  body: { status, lastSeen? }
export async function POST(req: Request) {
  try {
    const { userId: authId } = await auth()
    if (!authId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const { status } = await req.json()
    const me = await requireDbUser(authId)
    await updatePresence(me.id as string, status ?? "online")
    return NextResponse.json({ success: true })
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 500 })
  }
}

