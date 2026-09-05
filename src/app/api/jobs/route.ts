import { createClient } from "@/lib/supabase/server"
import { internalError } from "@/lib/api-error"
import { parseBody } from "@/lib/validation"
import { NextResponse } from "next/server"
import { getJobs, createJob } from "@/server/db/events-jobs"
import { z } from "zod"

// PostJobModal.tsx sends type: 'job' | 'internship', skillsRequired, remote,
// duration — but the jobs table's `type` CHECK constraint only allows
// full_time/part_time/internship/contract ('job' would violate it and fail
// the insert), the column is `skills` not `skillsRequired`, and remote/
// duration have no matching column (same frontend/schema drift pattern as
// research paper upload, questions.course, and event creation found
// earlier this session — see docs/TASKS.md §2).
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
    const { title, company, description, location, type, salary, skillsRequired } = parsed.data
    // remote and duration intentionally dropped — no matching column on
    // jobs (see schema note above). 'job' maps to 'full_time' since that's
    // the DB's valid default for a non-internship posting.
    const job = await createJob({
      title,
      company,
      description,
      location,
      type: type === "internship" ? "internship" : "full_time",
      salary,
      skills: skillsRequired,
      posted_by: userId,
    })
    return NextResponse.json(job)
  } catch (err) {
    return internalError(err)
  }
}
