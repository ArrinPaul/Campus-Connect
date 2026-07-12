import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"
import { getQuestions, createQuestion } from "@/server/db/content"

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
    return NextResponse.json({ error: (err as Error).message }, { status: 500 })
  }
}

// POST /api/questions  body: { title, body, tags? }
export async function POST(req: Request) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    const userId = user?.id
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const body = await req.json()
    const question = await createQuestion({ ...body, author_id: userId })
    return NextResponse.json(question)
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 500 })
  }
}
