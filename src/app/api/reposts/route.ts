import { auth } from "@clerk/nextjs/server"
import { NextResponse } from "next/server"
import { repost, isReposted } from "@/server/db/misc"
import { requireDbUser } from "@/server/db/client"

// GET /api/reposts/check?postId=...
export async function GET(req: Request) {
  try {
    const { userId: clerkId } = await auth()
    if (!clerkId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const { searchParams } = new URL(req.url)
    const postId = searchParams.get("postId")
    if (!postId) return NextResponse.json({ error: "postId required" }, { status: 400 })

    const me = await requireDbUser(clerkId)
    const reposted = await isReposted(postId, me.id as string)
    return NextResponse.json({ isReposted: reposted })
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 500 })
  }
}

// POST /api/reposts  body: { postId }
export async function POST(req: Request) {
  try {
    const { userId: clerkId } = await auth()
    if (!clerkId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const { postId } = await req.json()
    if (!postId) return NextResponse.json({ error: "postId required" }, { status: 400 })

    const me = await requireDbUser(clerkId)
    await repost(postId, me.id as string)
    return NextResponse.json({ success: true })
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 500 })
  }
}
