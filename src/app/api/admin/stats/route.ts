import { createClient } from "@/lib/supabase/server"
import { internalError } from "@/lib/api-error"
import { NextResponse } from "next/server"

export async function GET() {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    const userId = user?.id
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    // Verify admin status
    const { data: userData } = await supabase.from("users").select("role").eq("id", userId).single()
    if (!userData || userData.role !== "admin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    // Fetch stats
    const [{ count: usersCount }, { count: postsCount }, { count: commentsCount }] = await Promise.all([
      supabase.from("users").select("*", { count: "exact", head: true }),
      supabase.from("posts").select("*", { count: "exact", head: true }),
      supabase.from("comments").select("*", { count: "exact", head: true }),
    ])

    return NextResponse.json({
      totalUsers: usersCount || 0,
      newUsersThisWeek: Math.floor((usersCount || 0) * 0.1), // Mock data
      reportedPosts: Math.floor((postsCount || 0) * 0.05), // Mock data
      reportedComments: Math.floor((commentsCount || 0) * 0.05), // Mock data
      apiUsage: "8.4k requests",
      dbSize: "2.4 MB"
    })
  } catch (err) {
    return internalError(err)
  }
}
