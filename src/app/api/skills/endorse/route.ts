import { auth } from "@/lib/auth/server"
import { NextResponse } from "next/server"
import { endorseSkill } from "@/server/db/misc"
import { requireDbUser } from "@/server/db/client"

// POST /api/skills/endorse  body: { userId, skill }
export async function POST(req: Request) {
  try {
    const { userId: clerkId } = await auth()
    if (!clerkId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const { userId, skill } = await req.json()
    if (!userId || !skill) return NextResponse.json({ error: "userId and skill required" }, { status: 400 })

    const me = await requireDbUser(clerkId)
    await endorseSkill(userId, me.id as string, skill)
    return NextResponse.json({ success: true })
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 500 })
  }
}
