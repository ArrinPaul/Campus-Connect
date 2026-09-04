import { internalError } from "@/lib/api-error"
import { NextResponse } from "next/server"
import { getUserStories } from "@/server/db/content"

// GET /api/stories/user?userId=...
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url)
    const userId = searchParams.get("userId") || searchParams.get("id")
    if (!userId) return NextResponse.json({ error: "userId required" }, { status: 400 })

    const stories = await getUserStories(userId)
    return NextResponse.json({ stories })
  } catch (err) {
    return internalError(err)
  }
}
