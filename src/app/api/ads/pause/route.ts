import { createClient } from "@/lib/supabase/server"
import { internalError } from "@/lib/api-error"
import { NextResponse } from "next/server"

// POST /api/ads/pause — Toggle ad campaign status
export async function POST(req: Request) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await req.json().catch(() => ({}))
    const adId = body.adId || body.ad_id
    if (!adId) {
      return NextResponse.json({ error: "adId is required" }, { status: 400 })
    }

    const { data: ad, error: findError } = await supabase
      .from("ad_campaigns")
      .select("*")
      .eq("id", adId)
      .single()

    if (findError || !ad) {
      return NextResponse.json({ error: "Ad campaign not found" }, { status: 404 })
    }

    if (ad.advertiser_id !== user.id) {
      const { data: userData } = await supabase.from("users").select("is_admin").eq("id", user.id).single()
      if (!userData?.is_admin) {
        return NextResponse.json({ error: "Forbidden: Not campaign owner" }, { status: 403 })
      }
    }

    const newStatus = ad.status === "active" ? "paused" : "active"
    const { data: updated, error: updateError } = await supabase
      .from("ad_campaigns")
      .update({ status: newStatus, updated_at: new Date().toISOString() })
      .eq("id", adId)
      .select()
      .single()

    if (updateError) return NextResponse.json({ error: updateError.message }, { status: 500 })
    return NextResponse.json({ success: true, ad: updated }, { status: 200 })
  } catch (err) {
    return internalError(err)
  }
}