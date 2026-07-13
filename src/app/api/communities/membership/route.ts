import { createClient } from "@/lib/supabase/server"
import { internalError } from "@/lib/api-error"
import { NextResponse } from "next/server"
import { getMembership } from "@/server/db/communities"

// GET /api/communities/membership?communityId=...
export async function GET(req: Request) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    const userId = user?.id
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const { searchParams } = new URL(req.url)
    const communityId = searchParams.get("communityId")
    if (!communityId) return NextResponse.json({ error: "communityId required" }, { status: 400 })

    const membership = await getMembership(communityId, userId)
    return NextResponse.json(membership ?? { role: null })
  } catch (err) {
    return internalError(err)
  }
}