import { createClient } from "@/lib/supabase/server"
import { internalError } from "@/lib/api-error"
import { NextResponse } from "next/server"
import { purchaseListing } from "@/server/db/misc"

// POST /api/marketplace/purchase  body: { listingId, message? }
export async function POST(req: Request) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const body = await req.json().catch(() => ({}))
    const listingId = body.listingId || body.id
    if (!listingId) return NextResponse.json({ error: "listingId required" }, { status: 400 })
    const message = typeof body.message === "string" ? body.message.trim().slice(0, 500) : undefined

    const result = await purchaseListing(listingId, user.id, message || undefined)
    if ("error" in result) return NextResponse.json({ error: result.error }, { status: result.status })
    return NextResponse.json(result.data, { status: 201 })
  } catch (err) {
    return internalError(err)
  }
}
