import { NextResponse } from "next/server"
import { internalError } from "@/lib/api-error"
import { getEndorsements } from "@/server/db/misc"

// GET /api/skills/endorsements?userId=...
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url)
    const userId = searchParams.get("userId")
    if (!userId) return NextResponse.json({ error: "userId required" }, { status: 400 })

    const endorsements = await getEndorsements(userId)
    return NextResponse.json(endorsements)
  } catch (err) {
    return internalError(err)
  }
}
