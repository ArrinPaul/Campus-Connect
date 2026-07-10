import { auth } from "@/lib/auth/server"
import { NextResponse } from "next/server"
import { applyToJob } from "@/server/db/events-jobs"

// POST /api/jobs/apply  body: { jobId, coverLetter? }
export async function POST(req: Request) {
  try {
    const { userId } = await auth()
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const { jobId, coverLetter } = await req.json()
    if (!jobId) return NextResponse.json({ error: "jobId required" }, { status: 400 })

    await applyToJob(jobId, userId, coverLetter)
    return NextResponse.json({ success: true })
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 500 })
  }
}
