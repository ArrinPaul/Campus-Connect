import { createClient } from "@/lib/supabase/server"
import { internalError } from "@/lib/api-error"
import { NextResponse } from "next/server"
import { getResources, uploadResource } from "@/server/db/content"

// GET /api/resources?limit=...&course=...&search=...
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url)
    const limit = Number(searchParams.get("limit") ?? "20")
    const course = searchParams.get("course") ?? undefined
    const search = searchParams.get("search") ?? undefined

    const result = await getResources(limit, 0, { course, search })
    return NextResponse.json(result)
  } catch (err) {
    return internalError(err)
  }
}

// POST /api/resources  body: { title, description, url, type }
export async function POST(req: Request) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    const userId = user?.id
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const body = await req.json()
    const resource = await uploadResource({ ...body, uploaded_by: userId })
    return NextResponse.json(resource)
  } catch (err) {
    return internalError(err)
  }
}
