import { auth } from "@/lib/auth/server"
import { NextResponse } from "next/server"
import { getMyApplications } from "@/server/db/events-jobs"
import { requireDbUser } from "@/server/db/client"

// GET /api/jobs/applications
export async function GET() {
  try {
    const { userId: clerkId } = await auth()
    if (!clerkId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const me = await requireDbUser(clerkId)
    const applications = await getMyApplications(me.id as string)
    return NextResponse.json(applications)
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 500 })
  }
}
