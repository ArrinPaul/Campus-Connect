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
    const { data: userData } = await supabase.from("users").select("role, is_admin").eq("id", userId).single()
    if (!userData || (!userData.is_admin && userData.role !== "admin")) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()

    // Fetch actual db counts
    const [
      { count: usersCount },
      { count: newUsersThisWeek },
      { count: reportedPosts },
      { count: reportedComments }
    ] = await Promise.all([
      supabase.from("users").select("*", { count: "exact", head: true }),
      supabase.from("users").select("*", { count: "exact", head: true }).gt("created_at", sevenDaysAgo),
      supabase.from("content_reports").select("*", { count: "exact", head: true }).eq("target_type", "post").eq("status", "pending"),
      supabase.from("content_reports").select("*", { count: "exact", head: true }).eq("target_type", "comment").eq("status", "pending"),
    ])

    return NextResponse.json({
      totalUsers: usersCount || 0,
      newUsersThisWeek: newUsersThisWeek || 0,
      reportedPosts: reportedPosts || 0,
      reportedComments: reportedComments || 0,
      apiUsage: "Dynamic",
      dbSize: "Dynamic"
    })
  } catch (err) {
    return internalError(err)
  }
}
