import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"
import { internalError } from "@/lib/api-error"

// POST /api/users/export — export all user data as JSON (GDPR compliance)
export async function POST() {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    const userId = user?.id
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const [profile, posts, comments, bookmarks, messages, notifications] = await Promise.all([
      supabase.from("users").select("*").eq("id", userId).single(),
      supabase.from("posts").select("*").eq("author_id", userId),
      supabase.from("comments").select("*").eq("author_id", userId),
      supabase.from("bookmarks").select("*").eq("user_id", userId),
      supabase.from("messages").select("*").eq("sender_id", userId),
      supabase.from("notifications").select("*").eq("user_id", userId),
    ])

    const exportData = {
      exportedAt: new Date().toISOString(),
      profile: profile.data,
      posts: posts.data ?? [],
      comments: comments.data ?? [],
      bookmarks: bookmarks.data ?? [],
      messages: messages.data ?? [],
      notifications: notifications.data ?? [],
    }

    return new NextResponse(JSON.stringify(exportData, null, 2), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        "Content-Disposition": `attachment; filename="campus-connect-export-${userId}.json"`,
      },
    })
  } catch (err) {
    return internalError(err)
  }
}

// GET not allowed — only POST for intentional export
export async function GET() {
  return NextResponse.json({ error: "Use POST to export data" }, { status: 405 })
}
