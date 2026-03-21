import { auth } from "@/lib/auth/server"
import { NextResponse } from "next/server"
import { createPost } from "@/server/db/posts"

// POST /api/posts
export async function POST(req: Request) {
  try {
    const { userId } = await auth()
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const body = await req.json()
    if (!body.content?.trim()) return NextResponse.json({ error: "Content required" }, { status: 400 })

    const post = await createPost(userId, body)
    return NextResponse.json(post, { status: 201 })
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 500 })
  }
}
