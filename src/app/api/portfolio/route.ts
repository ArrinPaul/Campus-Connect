import { auth } from "@/lib/auth/server"
import { NextResponse } from "next/server"
import { getPortfolio, addProject } from "@/server/db/misc"
import { requireDbUser } from "@/server/db/client"

// GET /api/portfolio?userId=...
export async function GET(req: Request) {
  try {
    const { userId: authId } = await auth()
    if (!authId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const { searchParams } = new URL(req.url)
    const userId = searchParams.get("userId")

    let targetId: string
    if (userId) {
      targetId = userId
    } else {
      const me = await requireDbUser(authId)
      targetId = me.id as string
    }

    const portfolio = await getPortfolio(targetId)
    return NextResponse.json(portfolio)
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 500 })
  }
}

// POST /api/portfolio  body: project data
export async function POST(req: Request) {
  try {
    const { userId: authId } = await auth()
    if (!authId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const me = await requireDbUser(authId)
    const body = await req.json()
    const project = await addProject(me.id as string, body)
    return NextResponse.json(project)
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 500 })
  }
}

