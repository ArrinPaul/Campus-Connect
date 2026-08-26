import { createClient } from "@/lib/supabase/server"
import { internalError } from "@/lib/api-error"
import { getJobApplications } from "@/server/db/events-jobs"
import { NextResponse } from "next/server"

// GET /api/jobs/job-applications?jobId=...
export async function GET(req: Request) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const { searchParams } = new URL(req.url)
    const jobId = searchParams.get("jobId") || searchParams.get("id")

    if (!jobId) {
      return NextResponse.json({ error: "Missing jobId parameter" }, { status: 400 })
    }

    const { data: profile } = await supabase.from("users").select("is_admin").eq("id", user.id).single()
    const isAdmin = Boolean(profile?.is_admin)

    const applications = await getJobApplications(jobId, user.id, isAdmin)
    return NextResponse.json(applications)
  } catch (err) {
    return internalError(err)
  }
}