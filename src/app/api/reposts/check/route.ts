import { createClient } from "@/lib/supabase/server"
import { internalError } from "@/lib/api-error"
import { NextResponse } from "next/server"
import { isReposted } from "@/server/db/misc"

// GET /api/reposts/check?postId=...
export async function GET(req: Request) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const { searchParams } = new URL(req.url)
    const postId = searchParams.get("postId") || searchParams.get("id")
    if (!postId) return NextResponse.json({ error: "postId required" }, { status: 400 })

    const reposted = await isReposted(postId, user.id)
    return NextResponse.json({ reposted })
  } catch (err) {
    return internalError(err)
  }
}
