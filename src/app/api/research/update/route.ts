import { createClient } from "@/lib/supabase/server"
import { internalError } from "@/lib/api-error"
import { NextResponse } from "next/server"
import { updatePaper } from "@/server/db/content"

// POST or PATCH /api/research/update
export async function POST(req: Request) {
  return handleUpdate(req)
}

export async function PATCH(req: Request) {
  return handleUpdate(req)
}

async function handleUpdate(req: Request) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    const userId = user?.id
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const body = await req.json().catch(() => ({}))
    const paperId = body.id || body.paperId || body.paper_id
    if (!paperId) {
      return NextResponse.json({ error: "paperId is required" }, { status: 400 })
    }

    const { id, paperId: _pid, paper_id: _p_id, ...updates } = body
    const result = await updatePaper(paperId, userId, updates)

    if ("error" in result) {
      return NextResponse.json({ error: result.error }, { status: result.status })
    }

    return NextResponse.json(result.data)
  } catch (err) {
    return internalError(err)
  }
}