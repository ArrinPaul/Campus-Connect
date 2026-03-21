import { auth } from "@/lib/auth/server"
import { NextResponse } from "next/server"
import { getUserPosts } from "@/server/db/posts"

// GET /api/posts/user?userId=xxx&limit=20&cursor=xxx
export async function GET(req: Request) {
  try {
    const { userId: authId } = await auth()
    const url = new URL(req.url)
    const uid = url.searchParams.get("userId") ?? authId
    if (!uid) return NextResponse.json({ error: "userId required" }, { status: 400 })

    const limit = parseInt(url.searchParams.get("limit") ?? "20")
    const cursor = url.searchParams.get("cursor") ?? undefined

    const result = await getUserPosts(uid, limit, cursor)
    return NextResponse.json(result)
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 500 })
  }
}

