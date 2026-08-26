import { createClient } from "@/lib/supabase/server"
import { internalError } from "@/lib/api-error"
import { updateJob } from "@/server/db/events-jobs"
import { NextResponse } from "next/server"

async function handleUpdate(req: Request) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const body = await req.json()
    const jobId = body.id || body.jobId

    if (!jobId) {
      return NextResponse.json({ error: "Missing job ID" }, { status: 400 })
    }

    const { id, jobId: _jid, ...updateData } = body

    // Check if user is admin
    const { data: profile } = await supabase.from("users").select("is_admin").eq("id", user.id).single()
    const isAdmin = Boolean(profile?.is_admin)

    const updated = await updateJob(jobId, user.id, updateData, isAdmin)
    if (!updated) {
      return NextResponse.json({ error: "Job posting not found or update failed" }, { status: 404 })
    }

    if ((updated as any).error === "Forbidden") {
      return NextResponse.json({ error: "Forbidden: You are not the creator of this job posting" }, { status: 403 })
    }

    return NextResponse.json(updated)
  } catch (err) {
    return internalError(err)
  }
}

export async function PATCH(req: Request) {
  return handleUpdate(req)
}

export async function POST(req: Request) {
  return handleUpdate(req)
}