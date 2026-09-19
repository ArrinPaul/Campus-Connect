import { createClient } from "@/lib/supabase/server"
import { internalError } from "@/lib/api-error"
import { NextResponse } from "next/server"
import { getListingTransactions } from "@/server/db/misc"

// GET /api/marketplace/transactions?listingId=...  (seller only)
export async function GET(req: Request) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const { searchParams } = new URL(req.url)
    const listingId = searchParams.get("listingId") ?? searchParams.get("id")
    if (!listingId) return NextResponse.json({ error: "listingId required" }, { status: 400 })

    return NextResponse.json(await getListingTransactions(listingId, user.id))
  } catch (err) {
    return internalError(err)
  }
}
