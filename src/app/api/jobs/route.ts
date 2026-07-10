import { auth } from "@/lib/auth/server"
import { NextResponse } from "next/server"
import { getJobs, createJob } from "@/server/db/events-jobs"

// GET /api/jobs?limit=...&offset=...
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url)
    const limit = Number(searchParams.get("limit") ?? "20")
    const offset = Number(searchParams.get("offset") ?? "0")
    const result = await getJobs(limit, offset)
    return NextResponse.json(result)
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 500 })
  }
}

// POST /api/jobs  body: job data
export async function POST(req: Request) {
  try {
    const { userId } = await auth()
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const body = await req.json()
    const job = await createJob({ ...body, posted_by: userId })
    return NextResponse.json(job)
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 500 })
  }
}
