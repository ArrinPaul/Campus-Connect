import { auth } from "@/lib/auth/server"
import { NextResponse } from "next/server"
import { getListings, createListing } from "@/server/db/misc"
import { requireDbUser } from "@/server/db/client"

// GET /api/marketplace?limit=...&cursor=...&category=...
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url)
    const limit = Number(searchParams.get("limit") ?? "20")
    const cursor = searchParams.get("cursor") ?? undefined
    const category = searchParams.get("category") ?? undefined

    const result = await getListings(limit, cursor, category)
    return NextResponse.json(result)
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 500 })
  }
}

// POST /api/marketplace  body: listing data
export async function POST(req: Request) {
  try {
    const { userId: authId } = await auth()
    if (!authId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const me = await requireDbUser(authId)
    const body = await req.json()
    const listing = await createListing(me.id as string, body)
    return NextResponse.json(listing)
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 500 })
  }
}
