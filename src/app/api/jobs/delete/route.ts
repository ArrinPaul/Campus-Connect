import { createClient } from "@/lib/supabase/server"
import { internalError } from "@/lib/api-error"
import { deleteJob } from "@/server/db/events-jobs"
import { NextResponse } from "next/server"

async function handleDelete(req: Request) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    let jobId: string | null = null

    if (req.method === "DELETE" || req.method === "GET") {
      const { searchParams } = new URL(req.url)
      jobId = searchParams.get("id") || searchParams.get("jobId")
    }

    if (!jobId && (req.method === "POST" || req.method === "DELETE")) {
      try {
        const body = await req.json()
        jobId = body.id || body.jobId
      } catch {
        // Body was empty or query param used
      }
    }

    if (!jobId) {
      return NextResponse.json({ error: "Missing job ID" }, { status: 400 })
    }

    // Check if user is admin
    const { data: profile } = await supabase.from("users").select("is_admin").eq("id", user.id).single()
    const isAdmin = Boolean(profile?.is_admin)

    const success = await deleteJob(jobId, user.id, isAdmin)
    if (!success) {
      return NextResponse.json({ error: "Job posting not found or unauthorized to delete" }, { status: 403 })
    }

    return NextResponse.json({ success: true, message: "Job posting deleted successfully" })
  } catch (err) {
    return internalError(err)
  }
}

export async function DELETE(req: Request) {
  return handleDelete(req)
}

export async function POST(req: Request) {
  return handleDelete(req)
}