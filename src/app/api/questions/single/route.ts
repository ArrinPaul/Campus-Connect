import { NextResponse } from "next/server"
import { getQuestionById } from "@/server/db/content"

// GET /api/questions/single?id=...
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url)
    const id = searchParams.get("id")
    if (!id) return NextResponse.json({ error: "id required" }, { status: 400 })

    const question = await getQuestionById(id)
    if (!question) return NextResponse.json({ error: "Not found" }, { status: 404 })
    return NextResponse.json(question)
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 500 })
  }
}
