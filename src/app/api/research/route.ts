import { auth } from "@/lib/auth/server"
import { NextResponse } from "next/server"
import { getPapers, uploadPaper } from "@/server/db/content"

// GET /api/research?limit=...&tag=...
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url)
    const limit = Number(searchParams.get("limit") ?? "20")
    const tag = searchParams.get("tag") ?? undefined

    const result = await getPapers(limit, 0, tag)
    return NextResponse.json(result)
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 500 })
  }
}

// POST /api/research  body: { title, abstract, authors, pdfUrl, tags? }
export async function POST(req: Request) {
  try {
    const { userId } = await auth()
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const body = await req.json()
    const paper = await uploadPaper({ ...body, uploaded_by: userId })
    return NextResponse.json(paper)
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 500 })
  }
}
