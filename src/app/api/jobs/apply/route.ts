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

    const { jobId, coverLetter } = await req.json()
    if (!jobId) return NextResponse.json({ error: "jobId required" }, { status: 400 })

    await applyToJob(jobId, userId, coverLetter)
    return NextResponse.json({ success: true })
  } catch (err) {
    return internalError(err)
  }
}
