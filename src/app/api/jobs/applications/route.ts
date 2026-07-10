import { auth } from "@/lib/auth/server"
import { NextResponse } from "next/server"
import { getMyApplications } from "@/server/db/events-jobs"

// GET /api/jobs/applications
export async function GET() {
  try {
    const { userId } = await auth()
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const applications = await getMyApplications(userId)
    return NextResponse.json(applications)
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 500 })
  }
}
