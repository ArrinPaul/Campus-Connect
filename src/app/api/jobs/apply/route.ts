import { auth } from "@/lib/auth/server"
import { NextResponse } from "next/server"
import { applyToJob } from "@/server/db/events-jobs"
import { requireDbUser } from "@/server/db/client"

// POST /api/jobs/apply  body: { jobId, coverLetter? }
export async function POST(req: Request) {
  try {
    const { userId: authId } = await auth()
    if (!authId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const { jobId, coverLetter } = await req.json()
    if (!jobId) return NextResponse.json({ error: "jobId required" }, { status: 400 })

    const me = await requireDbUser(authId)
    await applyToJob(jobId, me.id as string, coverLetter)
    return NextResponse.json({ success: true })
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 500 })
  }
}
