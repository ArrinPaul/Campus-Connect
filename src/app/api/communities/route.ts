import { createClient } from "@/lib/supabase/server"
import { internalError } from "@/lib/api-error"
import { parseBody } from "@/lib/validation"
import { NextResponse } from "next/server"
import { getCommunities, createCommunity, getCommunityBySlug } from "@/server/db/communities"
import { z } from "zod"

const createCommunitySchema = z.object({
  name: z.string().trim().min(2, "Name must be at least 2 characters").max(100),
  slug: z.string().trim().toLowerCase().regex(/^[a-z0-9-]+$/, "Slug may only contain lowercase letters, numbers, and hyphens").min(2).max(100),
  description: z.string().trim().max(2000).default(""),
  category: z.string().trim().max(50).default("General"),
})

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

    const parsed = await parseBody(req, createCommunitySchema)
    if ("response" in parsed) return parsed.response
    const body = parsed.data

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

