import { createClient } from "@/lib/supabase/server"
import { internalError } from "@/lib/api-error"
import { NextResponse } from "next/server"

// GET /api/push/preferences
export async function GET() {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { data } = await supabase
      .from("users")
      .select("notification_preferences")
      .eq("id", user.id)
      .single()

    return NextResponse.json(data?.notification_preferences ?? {})
  } catch (err) {
    return internalError(err)
  }
}

// PATCH /api/push/preferences
export async function PATCH(req: Request) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await req.json().catch(() => ({}))

    const { data, error } = await supabase
      .from("users")
      .update({
        notification_preferences: body,
        updated_at: new Date().toISOString(),
      })
      .eq("id", user.id)
      .select("notification_preferences")
      .single()

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json(data?.notification_preferences ?? {})
  } catch (err) {
    return internalError(err)
  }
}