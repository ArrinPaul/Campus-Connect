import { auth } from "@/lib/auth/client"
import { NextResponse } from "next/server"
import { viewStory } from "@/server/db/content"

// POST /api/stories/view  body: { storyId }
export async function POST(req: Request) {
  try {
    const { userId } = await auth()
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const { storyId } = await req.json()
    if (!storyId) return NextResponse.json({ error: "storyId required" }, { status: 400 })

    await viewStory(storyId, userId)
    return NextResponse.json({ success: true })
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 500 })
  }
}
