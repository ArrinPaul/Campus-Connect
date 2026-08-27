import { internalError } from "@/lib/api-error"
import { NextResponse } from "next/server"
import { searchResearchSemantic } from "@/server/recommendations/matching-engine"

// GET /api/research/search — Semantic + keyword research search
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url)
    const query = searchParams.get("q") || searchParams.get("query") || ""
    const limit = Math.min(50, Math.max(1, parseInt(searchParams.get("limit") || "20", 10)))
    const offset = Math.max(0, parseInt(searchParams.get("offset") || "0", 10))

    const papers = await searchResearchSemantic({ query, limit, offset })
    return NextResponse.json(papers, { status: 200 })
  } catch (err) {
    return internalError(err)
  }
}