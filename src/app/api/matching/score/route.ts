import { createClient } from "@/lib/supabase/server"
import { internalError } from "@/lib/api-error"
import { NextResponse } from "next/server"
import { calculateUserMatchScore } from "@/server/recommendations/matching-engine"

// GET /api/matching/score — Calculate compatibility score with a target user
export async function GET(req: Request) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { searchParams } = new URL(req.url)
    const targetUserId = searchParams.get("targetUserId") || searchParams.get("target_id")

    if (!targetUserId) {
      return NextResponse.json({ error: "targetUserId parameter is required" }, { status: 400 })
    }

    const [userRes, targetRes] = await Promise.all([
      supabase.from("users").select("id, name, university, department, skills, bio").eq("id", user.id).single(),
      supabase.from("users").select("id, name, university, department, skills, bio").eq("id", targetUserId).single(),
    ])

    if (!targetRes.data) {
      return NextResponse.json({ error: "Target user not found" }, { status: 404 })
    }

    const matchResult = calculateUserMatchScore(userRes.data || {}, targetRes.data)
    return NextResponse.json(matchResult, { status: 200 })
  } catch (err) {
    return internalError(err)
  }
}