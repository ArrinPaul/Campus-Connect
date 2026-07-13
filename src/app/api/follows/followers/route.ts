import { createClient } from "@/lib/supabase/server"
import { internalError } from "@/lib/api-error"
import { NextResponse } from "next/server"
import { getFollowers } from "@/server/db/follows"

// GET /api/follows/followers?userId=...&limit=...&cursor=...
export async function GET(req: Request) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    const authId = user?.id
    if (!authId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const { searchParams } = new URL(req.url)
    const userId = searchParams.get("userId")
    if (!userId) return NextResponse.json({ error: "userId required" }, { status: 400 })

    const limit = Number(searchParams.get("limit") ?? "20")
    const result = await getFollowers(userId, limit)
    return NextResponse.json(result)
  } catch (err) {
    return internalError(err)
  }
}

