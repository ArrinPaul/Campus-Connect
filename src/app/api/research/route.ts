import { createClient } from "@/lib/supabase/server"
import { internalError } from "@/lib/api-error"
import { parseBody } from "@/lib/validation"
import { NextResponse } from "next/server"
import { getPapers, uploadPaper } from "@/server/db/content"
import { z } from "zod"

// The frontend (UploadPaperModal.tsx) sends { title, abstract, authors,
// doi, pdfUrl, tags, lookingForCollaborators } — but the research_papers
// table only has columns for title/abstract/authors/tags/file_url. `doi`
// and `lookingForCollaborators` have no column to land in (same kind of
// frontend/schema drift as the `questions.course` gap found earlier this
// session — see docs/TASKS.md §2) and `pdfUrl` needs mapping to `file_url`.
// Accepting the real payload shape here and mapping it, rather than
// validating against a shape the client never actually sends.
const uploadPaperSchema = z.object({
  title: z.string().trim().min(2, "Title must be at least 2 characters").max(300),
  abstract: z.string().trim().max(5000).default(""),
  authors: z.array(z.string().trim().max(150)).max(20).default([]),
  pdfUrl: z.string().url().optional(),
  tags: z.array(z.string().trim().max(30)).max(10).default([]),
  doi: z.string().trim().max(200).optional(),
  lookingForCollaborators: z.boolean().optional(),
})

// GET /api/research?limit=...&tag=...
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url)
    const limit = Number(searchParams.get("limit") ?? "20")
    const tag = searchParams.get("tag") ?? undefined

    const result = await getPapers(limit, 0, tag)
    return NextResponse.json(result)
  } catch (err) {
    return internalError(err)
  }
}

// POST /api/research  body: { title, abstract, authors, pdfUrl, tags? }
export async function POST(req: Request) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    const userId = user?.id
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const parsed = await parseBody(req, uploadPaperSchema)
    if ("response" in parsed) return parsed.response
    const { title, abstract, authors, tags, pdfUrl } = parsed.data
    // doi and lookingForCollaborators intentionally dropped — no matching
    // column on research_papers (see schema note above).
    const paper = await uploadPaper({ title, abstract, authors, tags, file_url: pdfUrl, uploaded_by: userId })
    return NextResponse.json(paper)
  } catch (err) {
    return internalError(err)
  }
}
