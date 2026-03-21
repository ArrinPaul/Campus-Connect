import { auth } from "@/lib/auth/server"
import { NextResponse } from "next/server"
import { getActiveStories, createStory } from "@/server/db/content"
import { requireDbUser } from "@/server/db/client"

// GET /api/stories
export async function GET() {
  try {
    const { userId: authId } = await auth()
    if (!authId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const me = await requireDbUser(authId)
    const stories = await getActiveStories(me.id as string)
    return NextResponse.json(stories)
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 500 })
  }
}

// POST /api/stories  body: { mediaUrl, mediaType, caption?, duration? }
export async function POST(req: Request) {
  try {
    const { userId: authId } = await auth()
    if (!authId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const me = await requireDbUser(authId)
    const body = await req.json()
    const story = await createStory(me.id as string, body)
    return NextResponse.json(story)
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 500 })
  }
}

