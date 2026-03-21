import { auth } from "@/lib/auth/server"
import { NextResponse } from "next/server"
import { getResources, uploadResource } from "@/server/db/content"
import { requireDbUser } from "@/server/db/client"

// GET /api/resources?limit=...&cursor=...&type=...
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url)
    const limit = Number(searchParams.get("limit") ?? "20")
    const type = searchParams.get("type") ?? undefined

    const result = await getResources({ category: type, search: type }, limit)
    return NextResponse.json(result)
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 500 })
  }
}

// POST /api/resources  body: { title, description, url, type }
export async function POST(req: Request) {
  try {
    const { userId: authId } = await auth()
    if (!authId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const me = await requireDbUser(authId)
    const body = await req.json()
    const resource = await uploadResource(me.id as string, body)
    return NextResponse.json(resource)
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 500 })
  }
}

