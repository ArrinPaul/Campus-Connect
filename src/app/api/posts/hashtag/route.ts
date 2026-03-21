import { auth } from "@/lib/auth/server"
import { NextResponse } from "next/server"
import { getPostsByHashtag } from "@/server/db/posts"

export async function GET(req: Request) {
  try {
    const url = new URL(req.url)
    const tag = url.searchParams.get("tag")
    if (!tag) return NextResponse.json({ error: "tag required" }, { status: 400 })

    const limit = parseInt(url.searchParams.get("limit") ?? "20")
    const cursor = url.searchParams.get("cursor") ?? undefined

    const result = await getPostsByHashtag(tag, limit, cursor)
    return NextResponse.json(result)
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 500 })
  }
}
