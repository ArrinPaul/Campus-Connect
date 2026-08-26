import { createClient } from "@/lib/supabase/server"
import { internalError } from "@/lib/api-error"
import { NextResponse } from "next/server"
import { deletePaper } from "@/server/db/content"

// POST or DELETE /api/research/delete
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
    const paperId = body.id || body.paperId || body.paper_id || searchParams.get("id")

    if (!paperId) {
      return NextResponse.json({ error: "paperId is required" }, { status: 400 })
    }

    const result = await deletePaper(paperId, userId)
    if ("error" in result) {
      return NextResponse.json({ error: result.error }, { status: result.status })
    }

    return NextResponse.json({ success: true, id: paperId })
  } catch (err) {
    return internalError(err)
  }
}