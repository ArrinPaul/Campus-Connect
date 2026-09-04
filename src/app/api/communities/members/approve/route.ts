import { createClient } from "@/lib/supabase/server"
import { internalError } from "@/lib/api-error"
import { NextResponse } from "next/server"
import { approveMember } from "@/server/db/communities"

// POST /api/communities/members/approve  body: { communityId, requestId }
export async function POST(req: Request) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    const userId = user?.id
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const body = await req.json().catch(() => ({}))
    const { communityId, requestId } = body
    if (!communityId || !requestId) {
      return NextResponse.json({ error: "communityId and requestId are required" }, { status: 400 })
    }

    const result = await approveMember(communityId, requestId, userId)
    if ("error" in result) {
      return NextResponse.json({ error: result.error }, { status: result.status })
    }

    return NextResponse.json(result)
  } catch (err) {
    return internalError(err)
  }
}
