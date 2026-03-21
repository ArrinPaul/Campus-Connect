import { auth } from "@/lib/auth/server"
import { NextResponse } from "next/server"
import { getExplorePosts } from "@/server/db/posts"

export async function GET(req: Request) {
  try {
    const url = new URL(req.url)
    const limit = parseInt(url.searchParams.get("limit") ?? "20")
    const cursor = url.searchParams.get("cursor") ?? undefined

    const result = await getExplorePosts(limit, cursor)
    return NextResponse.json(result)
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 500 })
  }
}
