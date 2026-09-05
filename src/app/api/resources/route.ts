import { createClient } from "@/lib/supabase/server"
import { internalError } from "@/lib/api-error"
import { parseBody } from "@/lib/validation"
import { NextResponse } from "next/server"
import { getResources, uploadResource } from "@/server/db/content"
import { z } from "zod"

const uploadResourceSchema = z.object({
  title: z.string().trim().min(2, "Title must be at least 2 characters").max(200),
  description: z.string().trim().max(2000).default(""),
  course: z.string().trim().max(100).optional(),
  file_url: z.string().url(),
  file_type: z.string().max(50).optional(),
  file_size: z.number().nonnegative().optional(),
})

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

    const parsed = await parseBody(req, uploadResourceSchema)
    if ("response" in parsed) return parsed.response

    const resource = await uploadResource({ ...parsed.data, uploaded_by: userId })
    return NextResponse.json(resource)
  } catch (err) {
    return internalError(err)
  }
}
