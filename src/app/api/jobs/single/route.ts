import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { internalError } from "@/lib/api-error"
import { getJobById, getViewerApplication } from "@/server/db/events-jobs"

// GET /api/jobs/single?id=...  (also accepts jobId)
// Unknown ids return 200 null, not 404: useQuery drops the body of a non-2xx
// response, which would leave the page on its loading state forever.
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url)
    const id = searchParams.get("id") ?? searchParams.get("jobId")
    if (!id) return NextResponse.json({ error: "id required" }, { status: 400 })

    const job = await getJobById(id)
    if (!job) return NextResponse.json(null)

    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    const viewerApplication = user?.id ? await getViewerApplication(id, user.id) : null
    return NextResponse.json({ ...job, viewerApplication, isOwner: Boolean(user?.id && job.posted_by === user.id) })
  } catch (err) {
    return internalError(err)
  }
}
