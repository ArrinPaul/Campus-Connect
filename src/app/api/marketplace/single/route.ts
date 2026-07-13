import { NextResponse } from "next/server"
import { internalError } from "@/lib/api-error"
import { createClient } from "@/lib/supabase/server"

// GET /api/marketplace/single?id=...
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url)
    const id = searchParams.get("id")
    if (!id) return NextResponse.json({ error: "id required" }, { status: 400 })

    const supabase = await createClient()
    const { data, error } = await supabase
      .from("marketplace_listings")
      .select("*, seller:users!marketplace_listings_posted_by_fkey(id, name, profile_picture)")
      .eq("id", id)
      .single()
    if (error || !data) return NextResponse.json({ error: "Not found" }, { status: 404 })
    return NextResponse.json(data)
  } catch (err) {
    return internalError(err)
  }
}
