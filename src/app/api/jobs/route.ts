import { createClient } from "@/lib/supabase/server"
import { internalError } from "@/lib/api-error"
import { NextResponse } from "next/server"
import { getJobs, createJob } from "@/server/db/events-jobs"

// GET /api/jobs?limit=...&offset=...&q=...&type=...
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url)
    const limit = Number(searchParams.get("limit") ?? "20")
    const offset = Number(searchParams.get("offset") ?? "0")
    const query = searchParams.get("q") ?? undefined
    const type = searchParams.get("type") ?? undefined
    
    const result = await getJobs(limit, offset, { query, type })
    return NextResponse.json(result)
  } catch (err) {
    return internalError(err)
  }
}

// POST /api/jobs  body: job data
export async function POST(req: Request) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    const userId = user?.id
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const body = await req.json()
    const job = await createJob({ ...body, posted_by: userId })
    return NextResponse.json(job)
  } catch (err) {
    return internalError(err)
  }
}
