import { createClient } from "@/lib/supabase/server"
import { internalError } from "@/lib/api-error"
import { NextResponse } from "next/server"

// GET /api/marketplace/my-listings — Get active user's listings
export async function GET() {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { data, error } = await supabase
      .from("marketplace_listings")
      .select("*, seller:users!marketplace_listings_seller_id_fkey(id, name, username, profile_picture)")
      .eq("seller_id", user.id)
      .order("created_at", { ascending: false })

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json(data ?? [], { status: 200 })
  } catch (err) {
    return internalError(err)
  }
}