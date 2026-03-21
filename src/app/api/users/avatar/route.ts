import { auth } from "@/lib/auth/server"
import { NextResponse } from "next/server"
import { updateProfilePicture } from "@/server/db/users"

export async function POST(req: Request) {
  try {
    const { userId } = await auth()
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const { profilePicture } = await req.json()
    if (!profilePicture) return NextResponse.json({ error: "profilePicture URL required" }, { status: 400 })

    await updateProfilePicture(userId, profilePicture)
    return NextResponse.json({ success: true })
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 500 })
  }
}
