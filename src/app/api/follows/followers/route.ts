import { auth } from "@/lib/auth/server"
import { NextResponse } from "next/server"
import { getFollowers } from "@/server/db/follows"

// GET /api/follows/followers?userId=...&limit=...&cursor=...
export async function GET(req: Request) {
  try {
    const { userId: authId } = await auth()
    if (!authId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const { searchParams } = new URL(req.url)
    const userId = searchParams.get("userId")
    if (!userId) return NextResponse.json({ error: "userId required" }, { status: 400 })

    const limit = Number(searchParams.get("limit") ?? "20")
    const cursor = searchParams.get("cursor") ?? undefined

    const result = await getFollowers(userId, limit, cursor)
    return NextResponse.json(result)
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 500 })
  }
}

