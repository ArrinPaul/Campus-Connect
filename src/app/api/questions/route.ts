import { auth } from "@/lib/auth/server"
import { NextResponse } from "next/server"
import { getQuestions, createQuestion } from "@/server/db/content"
import { requireDbUser } from "@/server/db/client"

// GET /api/questions?limit=...&cursor=...&tag=...
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url)
    const limit = Number(searchParams.get("limit") ?? "20")
    const cursor = searchParams.get("cursor") ?? undefined
    const tag = searchParams.get("tag") ?? undefined

    const result = await getQuestions(limit, cursor, tag)
    return NextResponse.json(result)
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 500 })
  }
}

// POST /api/questions  body: { title, body, tags? }
export async function POST(req: Request) {
  try {
    const { userId: clerkId } = await auth()
    if (!clerkId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const me = await requireDbUser(clerkId)
    const body = await req.json()
    const question = await createQuestion(me.id as string, body)
    return NextResponse.json(question)
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 500 })
  }
}
