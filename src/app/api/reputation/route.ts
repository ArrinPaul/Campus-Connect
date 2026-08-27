import { createClient } from "@/lib/supabase/server"
import { internalError } from "@/lib/api-error"
import { NextResponse } from "next/server"
import { getUserReputation } from "@/server/db/gamification"

// GET /api/reputation?userId=...
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url)
    let userId: string | undefined = searchParams.get("userId") || searchParams.get("id") || undefined

    if (!userId) {
      const supabase = await createClient()
      const { data: { user } } = await supabase.auth.getUser()
      userId = user?.id
    }

    if (!userId) {
      return NextResponse.json({ error: "userId is required" }, { status: 400 })
    }

    const reputation = await getUserReputation(userId)
    return NextResponse.json(reputation)
  } catch (err) {
    return internalError(err)
  }
}
