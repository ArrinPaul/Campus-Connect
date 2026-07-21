import { createClient } from "@/lib/supabase/server"
import { internalError } from "@/lib/api-error"
import { NextResponse } from "next/server"
import { applyToJob } from "@/server/db/events-jobs"

// POST /api/jobs/apply  body: { jobId, coverLetter? }
export async function POST(req: Request) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    const userId = user?.id
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const body = await req.json().catch(() => ({}));
    const { jobId, coverLetter } = body;
    if (!jobId) return NextResponse.json({ error: "jobId required" }, { status: 400 })

    const result = await applyToJob(jobId, userId, coverLetter)
    if (!result) return NextResponse.json({ error: "Failed to apply to job or already applied" }, { status: 500 })
    return NextResponse.json({ success: true, application: result })
  } catch (err) {
    return internalError(err)
  }
}
