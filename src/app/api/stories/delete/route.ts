import { createClient } from "@/lib/supabase/server"
import { internalError } from "@/lib/api-error"
import { NextResponse } from "next/server"
import { deleteStory } from "@/server/db/content"

// POST or DELETE /api/stories/delete
export async function POST(req: Request) {
  return handleDelete(req)
}

export async function DELETE(req: Request) {
  return handleDelete(req)
}

async function handleDelete(req: Request) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    const userId = user?.id
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const body = await req.json().catch(() => ({}))
    const { searchParams } = new URL(req.url)
    const storyId = body.id || body.storyId || body.story_id || searchParams.get("id")

    if (!storyId) {
      return NextResponse.json({ error: "storyId is required" }, { status: 400 })
    }

    const result = await deleteStory(storyId, userId)
    if ("error" in result) {
      return NextResponse.json({ error: result.error }, { status: result.status })
    }

    return NextResponse.json({ success: true, id: storyId })
  } catch (err) {
    return internalError(err)
  }
}
