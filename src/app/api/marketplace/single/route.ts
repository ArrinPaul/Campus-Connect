import { internalError } from "@/lib/api-error"
import { NextResponse } from "next/server"
import { getListingById } from "@/server/db/misc"

// GET /api/marketplace/single?id=...
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url)
    const id = searchParams.get("id") || searchParams.get("listingId")
    if (!id) {
      return NextResponse.json({ error: "Listing ID required" }, { status: 400 })
    }

    const listing = await getListingById(id)
    if (!listing) {
      return NextResponse.json({ error: "Listing not found" }, { status: 404 })
    }

    return NextResponse.json(listing)
  } catch (err) {
    return internalError(err)
  }
}
