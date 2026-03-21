import { auth } from "@/lib/auth/server"
import { NextResponse } from "next/server"
import { getNotifications } from "@/server/db/notifications"
import { requireDbUser } from "@/server/db/client"

// GET /api/notifications?limit=...&cursor=...
export async function GET(req: Request) {
  try {
    const { userId: authId } = await auth()
    if (!authId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const me = await requireDbUser(authId)
    const { searchParams } = new URL(req.url)
    const filter = searchParams.get("filter") ?? undefined
    const limit = Number(searchParams.get("limit") ?? "20")
    const cursor = searchParams.get("cursor") ?? undefined

    const result = await getNotifications(me.authId as string, filter, limit, cursor)
    return NextResponse.json(result)
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 500 })
  }
}

