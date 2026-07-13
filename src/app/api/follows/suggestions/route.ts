import { createClient } from "@/lib/supabase/server"
import { internalError } from "@/lib/api-error"
import { NextResponse } from "next/server"
import { getSuggestedUsers } from "@/server/db/follows"

// GET /api/follows/suggestions?limit=...
export async function GET(req: Request) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    const userId = user?.id
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const { searchParams } = new URL(req.url)
    const limit = Number(searchParams.get("limit") ?? "10")

    const suggestions = await getSuggestedUsers(userId, limit)
    return NextResponse.json(suggestions)
  } catch (err) {
    return internalError(err)
  }
}
