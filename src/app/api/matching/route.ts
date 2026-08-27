import { createClient } from "@/lib/supabase/server"
import { internalError } from "@/lib/api-error"
import { NextResponse } from "next/server"
import { getRecommendedPartners } from "@/server/recommendations/matching-engine"

// GET /api/matching — Discover recommended study buddies & project partners
export async function GET(req: Request) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { searchParams } = new URL(req.url)
    const university = searchParams.get("university") || undefined
    const limit = Math.min(50, Math.max(1, parseInt(searchParams.get("limit") || "10", 10)))
    const offset = Math.max(0, parseInt(searchParams.get("offset") || "0", 10))

    const recommendations = await getRecommendedPartners({
      userId: user.id,
      university,
      limit,
      offset,
    })

    return NextResponse.json(recommendations, { status: 200 })
  } catch (err) {
    return internalError(err)
  }
}