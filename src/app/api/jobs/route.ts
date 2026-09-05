import { createClient } from "@/lib/supabase/server"
import { internalError } from "@/lib/api-error"
import { parseBody } from "@/lib/validation"
import { NextResponse } from "next/server"
import { getJobs, createJob } from "@/server/db/events-jobs"
import { z } from "zod"

// PostJobModal.tsx sends type: 'job' | 'internship' and skillsRequired --
// the jobs table's `type` CHECK constraint only allows full_time/part_time/
// internship/contract ('job' would violate it and fail the insert), and the
// column is `skills` not `skillsRequired`. remote/duration columns were
// added in migration 20240105000000 (see docs/TASKS.md §2 for the full
// history -- this route used to fail on every full-time posting before
// the type mapping was added).
const createJobSchema = z.object({
  title: z.string().trim().min(2, "Title must be at least 2 characters").max(200),
  company: z.string().trim().min(1, "Company is required").max(200),
  description: z.string().trim().max(5000).default(""),
  location: z.string().trim().max(300),
  type: z.enum(["job", "internship"]).default("job"),
  remote: z.boolean().optional(),
  duration: z.string().trim().max(100).optional(),
  salary: z.string().trim().max(100).optional(),
  skillsRequired: z.array(z.string().trim().max(50)).max(20).default([]),
})

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

    const parsed = await parseBody(req, createJobSchema)
    if ("response" in parsed) return parsed.response
    const { title, company, description, location, type, remote, duration, salary, skillsRequired } = parsed.data
    // 'job' maps to 'full_time' since that's the DB's valid default for a
    // non-internship posting (see schema note above).
    const job = await createJob({
      title,
      company,
      description,
      location,
      type: type === "internship" ? "internship" : "full_time",
      remote,
      duration,
      salary,
      skills: skillsRequired,
      posted_by: userId,
    })
    return NextResponse.json(job)
  } catch (err) {
    return internalError(err)
  }
}
