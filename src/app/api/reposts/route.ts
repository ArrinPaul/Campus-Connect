import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"
import { repost, isReposted } from "@/server/db/misc"

// GET /api/reposts?postId=...
export async function GET(req: Request) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    const userId = user?.id
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const { searchParams } = new URL(req.url)
    const postId = searchParams.get("postId")
    if (!postId) return NextResponse.json({ error: "postId required" }, { status: 400 })

    const reposted = await isReposted(postId, userId)
    return NextResponse.json({ isReposted: reposted })
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 500 })
  }
}

// POST /api/reposts  body: { postId, content? }
export async function POST(req: Request) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    const userId = user?.id
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const { postId, content } = await req.json()
    if (!postId) return NextResponse.json({ error: "postId required" }, { status: 400 })

    await repost(postId, userId, content)
    return NextResponse.json({ success: true })
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 500 })
  }
}
