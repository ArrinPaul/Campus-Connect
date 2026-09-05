import { createClient } from "@/lib/supabase/server"
import { internalError } from "@/lib/api-error"
import { NextResponse } from "next/server"
import { deleteComment } from "@/server/db/comments"
import { deleteMessage } from "@/server/db/messages"

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

    if (action === "delete") {
      if (type === "post") {
        await supabase.from("posts").delete().eq("id", targetId)
      } else if (type === "comment") {
        await deleteComment(targetId)
      } else if (type === "message") {
        await deleteMessage(targetId)
      } else if (type === "user") {
        return NextResponse.json(
          { error: "Reported users are suspended from the Users admin page, not deleted here" },
          { status: 400 }
        )
      }
    }

    // Update report status
    if (reportId) {
      const status = action === "delete" ? "resolved" : action === "dismiss" ? "dismissed" : "reviewed"
      await supabase
        .from("content_reports")
        .update({ status, reviewed_by: userId })
        .eq("id", reportId)
    }

    return NextResponse.json({ success: true })
  } catch (err) {
    return internalError(err)
  }
}
