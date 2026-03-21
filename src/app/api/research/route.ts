import { auth } from "@/lib/auth/server"
import { NextResponse } from "next/server"
import { getPapers, uploadPaper } from "@/server/db/content"
import { requireDbUser } from "@/server/db/client"

// GET /api/research?limit=...&cursor=...&tag=...
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url)
    const limit = Number(searchParams.get("limit") ?? "20")
    const cursor = searchParams.get("cursor") ?? undefined
    const tag = searchParams.get("tag") ?? undefined

    const result = await getPapers(limit, cursor, tag)
    return NextResponse.json(result)
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 500 })
  }
}

// POST /api/research  body: { title, abstract, authors, pdfUrl, tags? }
export async function POST(req: Request) {
  try {
    const { userId: authId } = await auth()
    if (!authId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const me = await requireDbUser(authId)
    const body = await req.json()
    const paper = await uploadPaper(me.id as string, body)
    return NextResponse.json(paper)
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 500 })
  }
}

