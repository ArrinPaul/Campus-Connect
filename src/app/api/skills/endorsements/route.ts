import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"
import { internalError } from "@/lib/api-error"
import { getEndorsements } from "@/server/db/misc"

// GET /api/skills/endorsements?userId=...
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url)
    const userId = searchParams.get("userId") || searchParams.get("id")
    if (!userId) return NextResponse.json({ error: "userId required" }, { status: 400 })

    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    const viewerId = user?.id

    const endorsements = await getEndorsements(userId, viewerId)
    return NextResponse.json(endorsements)
  } catch (err) {
    return internalError(err)
  }
}
