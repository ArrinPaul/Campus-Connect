import { auth } from "@clerk/nextjs/server"
import { NextResponse } from "next/server"
import { getResources, uploadResource } from "@/server/db/content"
import { requireDbUser } from "@/server/db/client"

// GET /api/resources?limit=...&cursor=...&type=...
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url)
    const limit = Number(searchParams.get("limit") ?? "20")
    const cursor = searchParams.get("cursor") ?? undefined
    const type = searchParams.get("type") ?? undefined

    const result = await getResources(limit, cursor, type)
    return NextResponse.json(result)
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 500 })
  }
}

// POST /api/resources  body: { title, description, url, type }
export async function POST(req: Request) {
  try {
    const { userId: clerkId } = await auth()
    if (!clerkId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const me = await requireDbUser(clerkId)
    const body = await req.json()
    const resource = await uploadResource(me.id as string, body)
    return NextResponse.json(resource)
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 500 })
  }
}
