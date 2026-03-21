import { auth } from "@/lib/auth/server"
import { NextResponse } from "next/server"
import { getAdDashboard } from "@/server/db/misc"
import { requireDbUser } from "@/server/db/client"

// GET /api/ads/dashboard
export async function GET() {
  try {
    const { userId: clerkId } = await auth()
    if (!clerkId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const me = await requireDbUser(clerkId)
    const dashboard = await getAdDashboard(me.id as string)
    return NextResponse.json(dashboard)
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 500 })
  }
}
