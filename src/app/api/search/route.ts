import { NextResponse } from "next/server"
import { universalSearch } from "@/server/db/misc"

// GET /api/search?q=...&type=...&limit=...
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url)
    const q = searchParams.get("q")
    if (!q) return NextResponse.json({ error: "q required" }, { status: 400 })

    const type = searchParams.get("type") ?? undefined
    const limit = Number(searchParams.get("limit") ?? "10")

    const results = await universalSearch(q, type, limit)
    return NextResponse.json(results)
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 500 })
  }
}
