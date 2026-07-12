import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"
import { endorseSkill } from "@/server/db/misc"

// POST /api/skills/endorse  body: { userId, skill }
export async function POST(req: Request) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    const authId = user?.id
    if (!authId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const { userId, skill } = await req.json()
    if (!userId || !skill) return NextResponse.json({ error: "userId and skill required" }, { status: 400 })

    await endorseSkill(userId, authId, skill)
    return NextResponse.json({ success: true })
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 500 })
  }
}

