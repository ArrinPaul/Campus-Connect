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

    const { data } = await supabase.from("users").select("id, name, username, profile_picture, role, university, created_at").order("created_at", { ascending: false }).limit(50)
    
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

    if (action === "make_admin") {
      await supabase.from("users").update({ role: "admin" }).eq("id", targetUserId)
    } else if (action === "suspend") {
      await supabase.from("users").update({ role: "suspended" }).eq("id", targetUserId)
    } else if (action === "restore") {
      await supabase.from("users").update({ role: "Student" }).eq("id", targetUserId)
    }

    return NextResponse.json({ success: true })
  } catch (err) {
    return internalError(err)
  }
}
