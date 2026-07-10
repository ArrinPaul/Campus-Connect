import { auth } from "@/lib/auth/client"
import { NextResponse } from "next/server"
import { getMyInvites } from "@/server/db/communities"

// GET /api/communities/my-invites
export async function GET() {
  try {
    const { userId } = await auth()
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const invites = await getMyInvites(userId)
    return NextResponse.json(invites)
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 500 })
  }
}