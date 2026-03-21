import { auth } from "@/lib/auth/server"
import { NextResponse } from "next/server"
import { getJobs, createJob } from "@/server/db/events-jobs"
import { requireDbUser } from "@/server/db/client"

// GET /api/jobs?limit=...&cursor=...&type=...&location=...
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url)
    const limit = Number(searchParams.get("limit") ?? "20")
    const cursor = searchParams.get("cursor") ?? undefined
    const filters = {
      search: searchParams.get("search") ?? undefined,
      type: searchParams.get("type") ?? undefined,
      isRemote:
        searchParams.get("isRemote") == null
          ? undefined
          : searchParams.get("isRemote") === "true",
    }

    const result = await getJobs(filters, limit, cursor)
    return NextResponse.json(result)
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 500 })
  }
}

// POST /api/jobs  body: job data
export async function POST(req: Request) {
  try {
    const { userId: authId } = await auth()
    if (!authId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const me = await requireDbUser(authId)
    const body = await req.json()
    const job = await createJob(me.id as string, body)
    return NextResponse.json(job)
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 500 })
  }
}
