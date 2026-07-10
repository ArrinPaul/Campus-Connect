import { auth } from "@/lib/auth/server"
import { NextResponse } from "next/server"
import { getActiveStories, createStory } from "@/server/db/content"

// GET /api/stories
export async function GET() {
  try {
    const { userId } = await auth()
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const stories = await getActiveStories()
    return NextResponse.json(stories)
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 500 })
  }
}

// POST /api/stories  body: { mediaUrl, mediaType, caption?, duration? }
export async function POST(req: Request) {
  try {
    const { userId } = await auth()
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const body = await req.json()
    const story = await createStory({ ...body, author_id: userId })
    return NextResponse.json(story)
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 500 })
  }
}
