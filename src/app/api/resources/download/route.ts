import { createClient } from "@/lib/supabase/server"
import { internalError } from "@/lib/api-error"
import { NextResponse } from "next/server"
import { getResourceDownloadUrl } from "@/server/db/content"

// GET /api/resources/download?id=...   or   POST { resourceId }
// (the frontend mutation helper always sends POST; GET is kept for links)
async function handle(resourceId: string | null) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  if (!resourceId) return NextResponse.json({ error: "Resource ID required" }, { status: 400 })

  const result = await getResourceDownloadUrl(resourceId)
  if ("error" in result) return NextResponse.json({ error: result.error }, { status: result.status })
  return NextResponse.json(result.data)
}

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url)
    return await handle(searchParams.get("id") || searchParams.get("resourceId"))
  } catch (err) {
    return internalError(err)
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}))
    return await handle(body.resourceId || body.id || null)
  } catch (err) {
    return internalError(err)
  }
}
