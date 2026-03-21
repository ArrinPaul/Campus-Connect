import { auth } from "@/lib/auth/server"
import { NextResponse } from "next/server"
import { updateNotificationPreferences, getUserByAuthId } from "@/server/db/users"

export async function GET() {
  try {
    const { userId } = await auth()
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const user = await getUserByAuthId(userId)
    let prefs = user?.notificationPreferences ?? {}
    if (typeof prefs === "string") {
      try { prefs = JSON.parse(prefs as unknown as string) } catch { prefs = {} }
    }
    return NextResponse.json(prefs)
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 500 })
  }
}

export async function PATCH(req: Request) {
  try {
    const { userId } = await auth()
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const body = await req.json()
    await updateNotificationPreferences(userId, body)
    return NextResponse.json({ success: true })
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 500 })
  }
}
