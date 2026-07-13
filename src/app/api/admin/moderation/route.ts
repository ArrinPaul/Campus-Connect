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

    // Because there is no reports table, we just mock some flagged posts for moderation demo
    const { data: posts } = await supabase
      .from("posts")
      .select("*, author:users!posts_author_id_fkey(id, name, username, profile_picture)")
      .order("created_at", { ascending: false })
      .limit(5)
    
    // Add fake report metadata to posts
    const reportedPosts = (posts || []).map(post => ({
        ...post,
        reportCount: Math.floor(Math.random() * 5) + 1,
        reportReason: ["Spam", "Harassment", "Inappropriate content", "Hate speech"][Math.floor(Math.random() * 4)],
        type: "post"
    }))

    return NextResponse.json(reportedPosts)
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

    const { targetId, action, type } = await req.json()
    if (!targetId || !action) return NextResponse.json({ error: "Missing required fields" }, { status: 400 })

    if (type === "post") {
        if (action === "delete") {
            await supabase.from("posts").delete().eq("id", targetId)
        }
    }

    return NextResponse.json({ success: true })
  } catch (err) {
    return internalError(err)
  }
}
