import { NextResponse } from "next/server"
import { internalError } from "@/lib/api-error"
import { universalSearch } from "@/server/db/misc"

// GET /api/search?q=...&limit=...
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url)
    const q = searchParams.get("q")
    if (!q) return NextResponse.json({ error: "q required" }, { status: 400 })

    const limit = Number(searchParams.get("limit") ?? "10")

    const results = await universalSearch(q)
    const response = NextResponse.json(results)
    response.headers.set("Cache-Control", "public, s-maxage=60, stale-while-revalidate=30")
    return response
  } catch (err) {
    return internalError(err)
  }
}
