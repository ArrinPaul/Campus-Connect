import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"
import { getPortfolio, addProject } from "@/server/db/misc"

// GET /api/portfolio?userId=...
export async function GET(req: Request) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    const authId = user?.id
    if (!authId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const { searchParams } = new URL(req.url)
    const userId = searchParams.get("userId")
    const targetId = userId ?? authId

    const portfolio = await getPortfolio(targetId)
    return NextResponse.json(portfolio)
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 500 })
  }
}

// POST /api/portfolio  body: project data
export async function POST(req: Request) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    const authId = user?.id
    if (!authId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const body = await req.json()
    const project = await addProject(authId, body)
    return NextResponse.json(project)
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 500 })
  }
}

