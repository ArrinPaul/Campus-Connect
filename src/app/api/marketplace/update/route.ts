import { createClient } from "@/lib/supabase/server"
import { internalError } from "@/lib/api-error"
import { parseBody } from "@/lib/validation"
import { NextResponse } from "next/server"
import { updateListing } from "@/server/db/misc"
import { z } from "zod"

// EditListingModal.tsx sends a `condition` field the marketplace_listings
// table has no column for (same frontend/schema drift pattern found
// repeatedly this session — see docs/TASKS.md §2). Accepting and
// intentionally dropping it here rather than forwarding it to an update
// that would 400 on an unknown column.
const updateListingSchema = z.object({
  title: z.string().trim().min(2, "Title must be at least 2 characters").max(200).optional(),
  description: z.string().trim().max(5000).optional(),
  price: z.number().nonnegative("Price must be 0 or more").max(1000000).optional(),
  category: z.enum(["books", "electronics", "furniture", "services", "other"]).optional(),
  images: z.array(z.string().url()).max(10).optional(),
  contact_info: z.string().trim().max(500).optional(),
  status: z.enum(["active", "sold", "removed"]).optional(),
  condition: z.string().optional(),
})

// POST or PATCH /api/marketplace/update
export async function POST(req: Request) {
  return handleUpdate(req)
}

export async function PATCH(req: Request) {
  return handleUpdate(req)
}

async function handleUpdate(req: Request) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    const userId = user?.id
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const rawBody = await req.json().catch(() => ({}))
    const listingId = rawBody.id || rawBody.listingId || rawBody.listing_id

    if (!listingId) {
      return NextResponse.json({ error: "listingId is required" }, { status: 400 })
    }

    const parsed = updateListingSchema.safeParse(rawBody)
    if (!parsed.success) {
      return NextResponse.json({ error: "Validation failed", issues: parsed.error.issues }, { status: 400 })
    }
    const { condition: _condition, ...updates } = parsed.data

    const result = await updateListing(listingId, userId, updates)

    if ("error" in result) {
      return NextResponse.json({ error: result.error }, { status: result.status })
    }

    return NextResponse.json(result.data)
  } catch (err) {
    return internalError(err)
  }
}
