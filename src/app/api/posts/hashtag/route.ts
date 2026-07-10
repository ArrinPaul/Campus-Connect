import { NextResponse } from "next/server"
import { getPostsByHashtag } from "@/server/db/posts"

export async function GET(req: Request) {
  try {
    const url = new URL(req.url)
    const tag = url.searchParams.get("tag")
    if (!tag) return NextResponse.json({ error: "tag required" }, { status: 400 })

    const limit = parseInt(url.searchParams.get("limit") ?? "20")
    const offset = parseInt(url.searchParams.get("offset") ?? "0")

    const result = await getPostsByHashtag(tag, limit, offset)
    return NextResponse.json(result)
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 500 })
  }
}
