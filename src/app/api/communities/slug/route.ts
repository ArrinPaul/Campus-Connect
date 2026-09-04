import { internalError } from "@/lib/api-error"
import { NextResponse } from "next/server"
import { getCommunityBySlug } from "@/server/db/communities"

// GET /api/communities/slug?slug=...
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url)
    const slug = searchParams.get("slug")
    if (!slug) return NextResponse.json({ error: "slug required" }, { status: 400 })

    const community = await getCommunityBySlug(slug)
    if (!community) return NextResponse.json({ error: "Community not found" }, { status: 404 })

    return NextResponse.json(community)
  } catch (err) {
    return internalError(err)
  }
}
