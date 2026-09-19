import { createClient } from "@/lib/supabase/server"
import { internalError } from "@/lib/api-error"
import { getJobApplications, updateApplicationStatus } from "@/server/db/events-jobs"
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

const STATUSES = new Set(["pending", "reviewed", "accepted", "rejected"])

// PATCH /api/jobs/job-applications  body: { applicationId, status }
export async function PATCH(req: Request) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const { applicationId, status } = await req.json().catch(() => ({}))
    if (!applicationId || !STATUSES.has(status)) {
      return NextResponse.json({ error: "applicationId and a valid status are required" }, { status: 400 })
    }

    const { data: profile } = await supabase.from("users").select("is_admin").eq("id", user.id).single()
    const updated = await updateApplicationStatus(applicationId, status, user.id, Boolean(profile?.is_admin))
    if (!updated) return NextResponse.json({ error: "Application not found" }, { status: 404 })
    return NextResponse.json(updated)
  } catch (err) {
    return internalError(err)
  }
}
