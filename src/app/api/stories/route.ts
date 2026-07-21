import { createClient } from "@/lib/supabase/server"
import { internalError } from "@/lib/api-error"
import { NextResponse } from "next/server"
import { getActiveStories, createStory } from "@/server/db/content"

// GET /api/stories
export async function GET() {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    const userId = user?.id
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const stories = await getActiveStories()
    return NextResponse.json(stories)
  } catch (err) {
    return internalError(err)
  }
}

// POST /api/stories  body: { mediaUrl, mediaType, caption?, duration? }
export async function POST(req: Request) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    const userId = user?.id
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const body = await req.json().catch(() => ({}))
    const story = await createStory({ ...body, author_id: userId })
    return NextResponse.json(story)
  } catch (err) {
    return internalError(err)
  }
}
