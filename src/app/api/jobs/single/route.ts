import { NextResponse } from "next/server"
import { getJobById } from "@/server/db/events-jobs"

// GET /api/jobs/single?id=...
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url)
    const id = searchParams.get("id")
    if (!id) return NextResponse.json({ error: "id required" }, { status: 400 })

    const job = await getJobById(id)
    if (!job) return NextResponse.json({ error: "Not found" }, { status: 404 })
    return NextResponse.json(job)
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 500 })
  }
}
