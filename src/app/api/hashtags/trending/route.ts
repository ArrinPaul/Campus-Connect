import { auth } from "@clerk/nextjs/server"
import { NextResponse } from "next/server"
import { getTrending, searchHashtags } from "@/server/db/hashtags"

// GET /api/hashtags/trending?limit=...
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url)
    const limit = Number(searchParams.get("limit") ?? "10")

    const trending = await getTrending(limit)
    return NextResponse.json(trending)
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 500 })
  }
}
