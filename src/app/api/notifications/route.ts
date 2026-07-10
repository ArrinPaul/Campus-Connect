import { auth } from "@/lib/auth/client"
import { NextResponse } from "next/server"
import { getNotifications } from "@/server/db/notifications"

// GET /api/notifications?limit=...&offset=...
export async function GET(req: Request) {
  try {
    const { userId } = await auth()
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const { searchParams } = new URL(req.url)
    const limit = Number(searchParams.get("limit") ?? "30")
    const offset = Number(searchParams.get("offset") ?? "0")

    const result = await getNotifications(userId, limit, offset)
    return NextResponse.json(result)
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 500 })
  }
}
