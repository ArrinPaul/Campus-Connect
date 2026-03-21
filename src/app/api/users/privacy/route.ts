import { auth } from "@/lib/auth/server"
import { NextResponse } from "next/server"
import { updatePrivacySettings, getUserByAuthId } from "@/server/db/users"

export async function GET() {
  try {
    const { userId } = await auth()
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const user = await getUserByAuthId(userId)
    let settings = user?.privacySettings ?? {}
    if (typeof settings === "string") {
      try { settings = JSON.parse(settings as unknown as string) } catch { settings = {} }
    }
    return NextResponse.json(settings)
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 500 })
  }
}

export async function PATCH(req: Request) {
  try {
    const { userId } = await auth()
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const body = await req.json()
    await updatePrivacySettings(userId, body)
    return NextResponse.json({ success: true })
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 500 })
  }
}
