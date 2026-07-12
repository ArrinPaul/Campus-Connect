import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"
import { getUserPosts } from "@/server/db/posts"

// GET /api/posts/user?userId=xxx&limit=20&offset=0
export async function GET(req: Request) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    const authId = user?.id
    const url = new URL(req.url)
    const uid = url.searchParams.get("userId") ?? authId
    if (!uid) return NextResponse.json({ error: "userId required" }, { status: 400 })

    const limit = parseInt(url.searchParams.get("limit") ?? "20")
    const offset = parseInt(url.searchParams.get("offset") ?? "0")

    const result = await getUserPosts(uid, limit, offset)
    return NextResponse.json(result)
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 500 })
  }
}
