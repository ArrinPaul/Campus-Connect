import { createClient } from "@/lib/supabase/server"
import { internalError } from "@/lib/api-error"
import { NextResponse } from "next/server"
import { getCommunities, createCommunity, getCommunityBySlug } from "@/server/db/communities"

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
    const offset = Number(searchParams.get("cursor") ?? "0")
    const category = searchParams.get("category") ?? undefined
    const search = searchParams.get("search") ?? undefined
    const result = await getCommunities(limit, offset, { category, search })
    return NextResponse.json(result)
  } catch (err) {
    return internalError(err)
  }
}

// POST /api/communities  body: { name, slug, description, category }
export async function POST(req: Request) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    const userId = user?.id
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const body = await req.json().catch(() => ({}));
    const community = await createCommunity({
      name: body.name,
      slug: body.slug,
      description: body.description,
      category: body.category,
      created_by: userId,
    })
    return NextResponse.json(community)
  } catch (err) {
    return internalError(err)
  }
}

