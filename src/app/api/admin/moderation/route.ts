import { createClient } from "@/lib/supabase/server"
import { internalError } from "@/lib/api-error"
import { NextResponse } from "next/server"

export async function GET() {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    const userId = user?.id
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const { data: userData } = await supabase.from("users").select("is_admin").eq("id", userId).single()
    if (!userData || !userData.is_admin) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const { data: reports } = await supabase
      .from("content_reports")
      .select(`
        *,
        reporter:users!content_reports_reporter_id_fkey(id, name, username, profile_picture)
      `)
      .eq("status", "pending")
      .order("created_at", { ascending: false })
      .limit(50)

    return NextResponse.json(reports ?? [])
  } catch (err) {
    return internalError(err)
  }
}

export async function POST(req: Request) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    const userId = user?.id
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const { data: userData } = await supabase.from("users").select("is_admin").eq("id", userId).single()
    if (!userData || !userData.is_admin) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const { targetId, action, type, reportId } = await req.json()
    if (!targetId || !action) return NextResponse.json({ error: "Missing required fields" }, { status: 400 })

    if (type === "post") {
      if (action === "delete") {
        await supabase.from("posts").delete().eq("id", targetId)
      }
    }

    // Update report status
    if (reportId) {
      await supabase
        .from("content_reports")
        .update({ status: action === "delete" ? "resolved" : "reviewed", reviewed_by: userId })
        .eq("id", reportId)
    }

    return NextResponse.json({ success: true })
  } catch (err) {
    return internalError(err)
  }
}
