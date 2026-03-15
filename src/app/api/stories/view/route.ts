import { auth } from "@clerk/nextjs/server"
import { NextResponse } from "next/server"
import { viewStory } from "@/server/db/content"
import { requireDbUser } from "@/server/db/client"

// POST /api/stories/view  body: { storyId }
export async function POST(req: Request) {
  try {
    const { userId: clerkId } = await auth()
    if (!clerkId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const { storyId } = await req.json()
    if (!storyId) return NextResponse.json({ error: "storyId required" }, { status: 400 })

    const me = await requireDbUser(clerkId)
    await viewStory(storyId, me.id as string)
    return NextResponse.json({ success: true })
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 500 })
  }
}
