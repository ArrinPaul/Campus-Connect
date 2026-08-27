import { createClient } from "@/lib/supabase/server"
import { internalError } from "@/lib/api-error"
import { NextResponse } from "next/server"
import { endorseSkill, removeEndorsement } from "@/server/db/misc"

// POST /api/skills/endorse  body: { userId, skill | skillName }
export async function POST(req: Request) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    const authId = user?.id
    if (!authId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const body = await req.json().catch(() => ({}))
    const userId = body.userId || body.user_id
    const skill = body.skill || body.skillName || body.skill_name

    if (!userId || !skill) {
      return NextResponse.json({ error: "userId and skill are required" }, { status: 400 })
    }

    const result = await endorseSkill(userId, authId, skill)
    if ("error" in result) {
      return NextResponse.json({ error: result.error }, { status: result.status })
    }

    return NextResponse.json(result, { status: 200 })
  } catch (err) {
    return internalError(err)
  }
}

// DELETE /api/skills/endorse  body: { userId, skill | skillName }
export async function DELETE(req: Request) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    const authId = user?.id
    if (!authId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const body = await req.json().catch(() => ({}))
    const { searchParams } = new URL(req.url)
    const userId = body.userId || body.user_id || searchParams.get("userId")
    const skill = body.skill || body.skillName || body.skill_name || searchParams.get("skill")

    if (!userId || !skill) {
      return NextResponse.json({ error: "userId and skill are required" }, { status: 400 })
    }

    const result = await removeEndorsement(userId, authId, skill)
    if ("error" in result) {
      return NextResponse.json({ error: result.error }, { status: result.status })
    }

    return NextResponse.json(result, { status: 200 })
  } catch (err) {
    return internalError(err)
  }
}
