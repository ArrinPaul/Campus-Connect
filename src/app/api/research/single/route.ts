import { internalError } from "@/lib/api-error"
import { NextResponse } from "next/server"
import { getPaperById } from "@/server/db/content"

// GET /api/research/single?id=...
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url)
    const id = searchParams.get("id") || searchParams.get("paperId")
    if (!id) {
      return NextResponse.json({ error: "Paper ID required" }, { status: 400 })
    }

    const paper = await getPaperById(id)
    if (!paper) {
      return NextResponse.json({ error: "Paper not found" }, { status: 404 })
    }

    return NextResponse.json(paper)
  } catch (err) {
    return internalError(err)
  }
}