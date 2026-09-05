import { createClient } from "@/lib/supabase/server"
import { internalError } from "@/lib/api-error"
import { parseBody } from "@/lib/validation"
import { NextResponse } from "next/server"
import { getQuestions, createQuestion } from "@/server/db/content"
import { z } from "zod"

const createQuestionSchema = z.object({
  title: z.string().trim().min(5, "Title must be at least 5 characters").max(300),
  content: z.string().trim().min(10, "Content must be at least 10 characters").max(10000),
  course: z.string().trim().max(100).optional(),
  tags: z.array(z.string().trim().max(30)).max(10).optional(),
})

// GET /api/questions?limit=...&offset=...&sort=...&tag=...&search=...
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url)
    const limit = Number(searchParams.get("limit") ?? "20")
    const offset = Number(searchParams.get("offset") ?? "0")
    const sort = searchParams.get("sort") ?? undefined
    const tag = searchParams.get("tag") ?? undefined
    const search = searchParams.get("search") ?? undefined

    const result = await getQuestions(limit, offset, { sort: sort ?? undefined, tag: tag ?? undefined, search: search ?? undefined })
    return NextResponse.json(result)
  } catch (err) {
    return internalError(err)
  }
}

// POST /api/questions  body: { title, body, tags? }
export async function POST(req: Request) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    const userId = user?.id
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const parsed = await parseBody(req, createQuestionSchema)
    if ("response" in parsed) return parsed.response
    const { title, content, course, tags } = parsed.data
    const question = await createQuestion({ title, content, course, tags, author_id: userId })
    return NextResponse.json(question)
  } catch (err) {
    return internalError(err)
  }
}
