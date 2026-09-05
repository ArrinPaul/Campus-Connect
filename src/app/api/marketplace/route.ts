import { createClient } from "@/lib/supabase/server"
import { internalError } from "@/lib/api-error"
import { parseBody } from "@/lib/validation"
import { NextResponse } from "next/server"
import { getListings, createListing } from "@/server/db/misc"
import { z } from "zod"

// CreateListingModal.tsx also sends `condition` and `university` — both
// columns added in migration 20240105000000 (see docs/TASKS.md §2).
const createListingSchema = z.object({
  title: z.string().trim().min(2, "Title must be at least 2 characters").max(200),
  description: z.string().trim().max(5000).default(""),
  price: z.number().nonnegative("Price must be 0 or more").max(1000000).optional(),
  category: z.enum(["books", "electronics", "furniture", "services", "other"]).default("other"),
  images: z.array(z.string().url()).max(10).default([]),
  contact_info: z.string().trim().max(500).optional(),
  condition: z.enum(["new", "like_new", "good", "fair", "poor"]).optional(),
  university: z.string().trim().max(200).optional(),
})

// GET /api/marketplace?limit=...&offset=...&category=...
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url)
    const limit = Number(searchParams.get("limit") ?? "20")
    const offset = Number(searchParams.get("offset") ?? "0")
    const category = searchParams.get("category") ?? undefined

    const result = await getListings(limit, offset, category ? { category } : undefined)
    return NextResponse.json(result)
  } catch (err) {
    return internalError(err)
  }
}

// POST /api/marketplace  body: listing data
export async function POST(req: Request) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    const userId = user?.id
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const parsed = await parseBody(req, createListingSchema)
    if ("response" in parsed) return parsed.response

    const listing = await createListing({ ...parsed.data, posted_by: userId })
    return NextResponse.json(listing)
  } catch (err) {
    return internalError(err)
  }
}
