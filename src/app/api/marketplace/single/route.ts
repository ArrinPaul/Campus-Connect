import { NextResponse } from "next/server"
import { getListingById } from "@/server/db/misc"

// GET /api/marketplace/single?id=...
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url)
    const id = searchParams.get("id")
    if (!id) return NextResponse.json({ error: "id required" }, { status: 400 })

    const listing = await getListingById(id)
    if (!listing) return NextResponse.json({ error: "Not found" }, { status: 404 })
    return NextResponse.json(listing)
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 500 })
  }
}
