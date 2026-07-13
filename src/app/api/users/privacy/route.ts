import { createClient } from "@/lib/supabase/server"
import { internalError } from "@/lib/api-error"
import { NextResponse } from "next/server"
import { updatePrivacySettings, getUserById } from "@/server/db/users"

export async function GET() {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    const userId = user?.id
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const dbUser = await getUserById(userId)
    return NextResponse.json(dbUser?.privacy_settings ?? {})
  } catch (err) {
    return internalError(err)
  }
}

export async function PATCH(req: Request) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    const userId = user?.id
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const body = await req.json()
    await updatePrivacySettings(userId, body)
    return NextResponse.json({ success: true })
  } catch (err) {
    return internalError(err)
  }
}
