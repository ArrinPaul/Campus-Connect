import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function GET() {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ user: null })
    }

    return NextResponse.json({
      user: {
        id: user.id,
        email: user.email ?? "",
        name: user.user_metadata?.name ?? user.email?.split("@")[0] ?? "User",
        profilePicture: user.user_metadata?.avatar_url,
      },
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to get session"
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
