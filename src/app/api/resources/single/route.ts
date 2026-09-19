import { createClient } from "@/lib/supabase/server"
import { internalError } from "@/lib/api-error"
import { NextResponse } from "next/server"
import { getResourceById } from "@/server/db/content"

// GET /api/resources/single?id=...
// Unknown ids return 200 null, not 404: useQuery drops non-2xx bodies, so a
// 404 would leave the page on its loading state forever.
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url)
    const id = searchParams.get("id") || searchParams.get("resourceId")
    if (!id) return NextResponse.json({ error: "Resource ID required" }, { status: 400 })

    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    const resource = await getResourceById(id, user?.id)
    return NextResponse.json(resource ?? null)
  } catch (err) {
    return internalError(err)
  }
}
