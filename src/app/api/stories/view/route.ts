import { createClient } from "@/lib/supabase/server"
import { internalError } from "@/lib/api-error"
import { NextResponse } from "next/server"
import { viewStory } from "@/server/db/content"

// POST /api/stories/view  body: { storyId }
export async function POST(req: Request) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    const userId = user?.id
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const body = await req.json().catch(() => ({}))
    const { storyId } = body
    if (!storyId) return NextResponse.json({ error: "storyId required" }, { status: 400 })

    await viewStory(storyId, userId)
    return NextResponse.json({ success: true })
  } catch (err) {
    return internalError(err)
  }
}
