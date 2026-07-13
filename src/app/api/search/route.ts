import { NextResponse } from "next/server"
import { internalError } from "@/lib/api-error"
import { universalSearch } from "@/server/db/misc"

// GET /api/search?q=...&type=...&limit=...
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url)
    const q = searchParams.get("q")
    if (!q) return NextResponse.json({ error: "q required" }, { status: 400 })

    const limit = Number(searchParams.get("limit") ?? "10")

    const results = await universalSearch(q)
    return NextResponse.json(results)
  } catch (err) {
    return internalError(err)
  }
}
