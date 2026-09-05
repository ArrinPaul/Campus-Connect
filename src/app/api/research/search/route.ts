import { internalError } from "@/lib/api-error"
import { NextResponse } from "next/server"
import { searchResearchSemantic } from "@/server/recommendations/matching-engine"
import { getEmbeddingProvider } from "@/server/recommendations/embedding-provider"

// GET /api/research/search — Semantic + keyword research search
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url)
    const query = searchParams.get("q") || searchParams.get("query") || ""
    const limit = Math.min(50, Math.max(1, parseInt(searchParams.get("limit") || "20", 10)))
    const offset = Math.max(0, parseInt(searchParams.get("offset") || "0", 10))

    const papers = await searchResearchSemantic({ query, limit, offset })
    // Response body stays a bare array (the established contract for this
    // route) — the degraded state is surfaced via a header instead, so
    // existing consumers are unaffected but it's not silent anymore either.
    const degraded = query.trim().length > 0 && getEmbeddingProvider().name === "mock"
    return NextResponse.json(papers, {
      status: 200,
      headers: degraded ? { "X-Semantic-Search-Degraded": "true" } : undefined,
    })
  } catch (err) {
    return internalError(err)
  }
}