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
      // 200 null, not 404: useQuery drops non-2xx bodies, so the page could
      // never tell "no such listing" from "still loading".
      return NextResponse.json(null)
    }

    return NextResponse.json(listing)
  } catch (err) {
    return internalError(err)
  }
}
