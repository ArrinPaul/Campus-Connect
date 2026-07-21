import { createClient } from "@/lib/supabase/server"
import { internalError } from "@/lib/api-error"
import { NextResponse } from "next/server"
import { endorseSkill } from "@/server/db/misc"

// POST /api/skills/endorse  body: { userId, skill }
export async function POST(req: Request) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    const authId = user?.id
    if (!authId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const body = await req.json().catch(() => ({}))
    const { userId, skill } = body
    if (!userId || !skill) return NextResponse.json({ error: "userId and skill required" }, { status: 400 })

    await endorseSkill(userId, authId, skill)
    return NextResponse.json({ success: true })
  } catch (err) {
    return internalError(err)
  }
}

