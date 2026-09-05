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

    const { data } = await supabase.from("users").select("id, name, username, profile_picture, role, is_admin, is_suspended, university, created_at").order("created_at", { ascending: false }).limit(50)

    return NextResponse.json(data ?? [])
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

    const { targetUserId, action } = await req.json()
    if (!targetUserId || !action) return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    if (action === "remove_admin" && targetUserId === userId) {
      return NextResponse.json({ error: "You cannot remove your own admin access" }, { status: 400 })
    }

    // is_admin/is_suspended are dedicated flags — users.role is a CHECK-
    // constrained enum ('Student' | 'Research Scholar' | 'Faculty') that
    // was never meant to carry moderation state.
    if (action === "make_admin") {
      await supabase.from("users").update({ is_admin: true }).eq("id", targetUserId)
    } else if (action === "remove_admin") {
      await supabase.from("users").update({ is_admin: false }).eq("id", targetUserId)
    } else if (action === "suspend") {
      await supabase.from("users").update({ is_suspended: true }).eq("id", targetUserId)
    } else if (action === "unsuspend") {
      await supabase.from("users").update({ is_suspended: false }).eq("id", targetUserId)
    } else {
      return NextResponse.json({ error: "Unknown action" }, { status: 400 })
    }

    return NextResponse.json({ success: true })
  } catch (err) {
    return internalError(err)
  }
}
