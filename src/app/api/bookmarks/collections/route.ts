import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"
import { getBookmarkCollections } from "@/server/db/bookmarks"

// GET /api/bookmarks/collections
export async function GET() {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    const userId = user?.id
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const collections = await getBookmarkCollections(userId)
    return NextResponse.json(collections)
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 500 })
  }
}
