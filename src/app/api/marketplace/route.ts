import { createClient } from "@/lib/supabase/server"
import { internalError } from "@/lib/api-error"
import { NextResponse } from "next/server"
import { getListings, createListing } from "@/server/db/misc"

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

    const body = await req.json()
    const listing = await createListing({ ...body, posted_by: userId })
    return NextResponse.json(listing)
  } catch (err) {
    return internalError(err)
  }
}
