import { createClient } from "@/lib/supabase/server"
import { internalError } from "@/lib/api-error"
import { NextResponse } from "next/server"
import { rateResource } from "@/server/db/content"

// POST /api/resources/rate  body: { resourceId, rating (1-5) }
export async function POST(req: Request) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const body = await req.json().catch(() => ({}))
    const resourceId = body.resourceId || body.id
    const rating = Number(body.rating)
    if (!resourceId) return NextResponse.json({ error: "resourceId required" }, { status: 400 })
    if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
      return NextResponse.json({ error: "rating must be a whole number from 1 to 5" }, { status: 400 })
    }

    const result = await rateResource(resourceId, user.id, rating)
    if ("error" in result) return NextResponse.json({ error: result.error }, { status: result.status })
    return NextResponse.json({ success: true })
  } catch (err) {
    return internalError(err)
  }
}
