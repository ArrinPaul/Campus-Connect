import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"
import { internalError } from "@/lib/api-error"

// POST /api/reports — report content
export async function POST(req: Request) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    const userId = user?.id
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const { targetId, targetType, reason, description } = await req.json()
    if (!targetId || !targetType || !reason) {
      return NextResponse.json({ error: "targetId, targetType, and reason are required" }, { status: 400 })
    }

    const validTypes = ["post", "comment", "message", "user"]
    const validReasons = ["spam", "harassment", "hate_speech", "inappropriate", "misinformation", "other"]
    if (!validTypes.includes(targetType)) {
      return NextResponse.json({ error: "Invalid target type" }, { status: 400 })
    }
    if (!validReasons.includes(reason)) {
      return NextResponse.json({ error: "Invalid reason" }, { status: 400 })
    }

    const { data, error } = await supabase
      .from("content_reports")
      .insert({
        reporter_id: userId,
        target_id: targetId,
        target_type: targetType,
        reason,
        description: description ?? "",
      })
      .select()
      .single()

    if (error) {
      if (error.code === "23505") {
        return NextResponse.json({ error: "You have already reported this content" }, { status: 409 })
      }
      return internalError(error, "Failed to create report")
    }

    return NextResponse.json(data, { status: 201 })
  } catch (err) {
    return internalError(err)
  }
}

// GET /api/reports — get reports (admin only)
export async function GET(req: Request) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    const userId = user?.id
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const { data: userData } = await supabase.from("users").select("is_admin").eq("id", userId).single()
    if (!userData || !userData.is_admin) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const { searchParams } = new URL(req.url)
    const status = searchParams.get("status") ?? "pending"

    const { data, error } = await supabase
      .from("content_reports")
      .select("*, reporter:users!content_reports_reporter_id_fkey(id, name, username)")
      .eq("status", status)
      .order("created_at", { ascending: false })
      .limit(50)

    if (error) return internalError(error, "Failed to fetch reports")
    return NextResponse.json(data ?? [])
  } catch (err) {
    return internalError(err)
  }
}
