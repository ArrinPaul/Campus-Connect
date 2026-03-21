import { auth } from "@/lib/auth/server"
import { NextResponse } from "next/server"
import { getCommunities, createCommunity, getCommunityBySlug } from "@/server/db/communities"
import { requireDbUser } from "@/server/db/client"

// GET /api/communities?slug=...&limit=...&cursor=...
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url)
    const slug = searchParams.get("slug")

    if (slug) {
      const community = await getCommunityBySlug(slug)
      if (!community) return NextResponse.json({ error: "Not found" }, { status: 404 })
      return NextResponse.json(community)
    }

    const limit = Number(searchParams.get("limit") ?? "20")
    const cursor = searchParams.get("cursor") ?? undefined
    const result = await getCommunities(limit, cursor)
    return NextResponse.json(result)
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 500 })
  }
}

// POST /api/communities  body: { name, slug, description, category, isPrivate? }
export async function POST(req: Request) {
  try {
    const { userId: authId } = await auth()
    if (!authId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const me = await requireDbUser(authId)
    const body = await req.json()
    const community = await createCommunity(me.id as string, body)
    return NextResponse.json(community)
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 500 })
  }
}

