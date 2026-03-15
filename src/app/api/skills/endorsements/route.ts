import { auth } from "@clerk/nextjs/server"
import { NextResponse } from "next/server"
import { getEndorsements, endorseSkill } from "@/server/db/misc"
import { requireDbUser } from "@/server/db/client"

// GET /api/skills/endorsements?userId=...
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url)
    const userId = searchParams.get("userId")
    if (!userId) return NextResponse.json({ error: "userId required" }, { status: 400 })

    const endorsements = await getEndorsements(userId)
    return NextResponse.json(endorsements)
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 500 })
  }
}
