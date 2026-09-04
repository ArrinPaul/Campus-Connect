import { createClient } from "@/lib/supabase/server"
import { internalError } from "@/lib/api-error"
import { NextResponse } from "next/server"
import { getResourceDownloadUrl } from "@/server/db/content"

// GET /api/resources/download?id=...
export async function GET(req: Request) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const { searchParams } = new URL(req.url)
    const id = searchParams.get("id") || searchParams.get("resourceId")
    if (!id) return NextResponse.json({ error: "Resource ID required" }, { status: 400 })

    const result = await getResourceDownloadUrl(id)
    if ("error" in result) {
      return NextResponse.json({ error: result.error }, { status: result.status })
    }

    return NextResponse.json(result.data)
  } catch (err) {
    return internalError(err)
  }
}
