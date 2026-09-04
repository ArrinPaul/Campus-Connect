import { createClient } from "@/lib/supabase/server"
import { internalError } from "@/lib/api-error"
import { NextResponse } from "next/server"
import { updateResource } from "@/server/db/content"

// POST or PATCH /api/resources/update
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
    const resourceId = body.id || body.resourceId || body.resource_id
    if (!resourceId) {
      return NextResponse.json({ error: "resourceId is required" }, { status: 400 })
    }

    const { id, resourceId: _rid, resource_id: _r_id, ...updates } = body
    const result = await updateResource(resourceId, userId, updates)

    if ("error" in result) {
      return NextResponse.json({ error: result.error }, { status: result.status })
    }

    return NextResponse.json(result.data)
  } catch (err) {
    return internalError(err)
  }
}
