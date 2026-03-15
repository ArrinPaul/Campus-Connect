import { auth } from "@clerk/nextjs/server"
import { NextResponse } from "next/server"
import { getFollowing } from "@/server/db/follows"

// GET /api/follows/following?userId=...&limit=...&cursor=...
export async function GET(req: Request) {
  try {
    const { userId: clerkId } = await auth()
    if (!clerkId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const { searchParams } = new URL(req.url)
    const userId = searchParams.get("userId")
    if (!userId) return NextResponse.json({ error: "userId required" }, { status: 400 })

    const limit = Number(searchParams.get("limit") ?? "20")
    const cursor = searchParams.get("cursor") ?? undefined

    const result = await getFollowing(userId, limit, cursor)
    return NextResponse.json(result)
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 500 })
  }
}
