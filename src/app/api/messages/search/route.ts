import { createClient } from "@/lib/supabase/server"
import { internalError } from "@/lib/api-error"
import { NextResponse } from "next/server"
import { searchMessages } from "@/server/db/messages"

// GET /api/messages/search?conversationId=...&searchQuery=...&limit=20
export async function GET(req: Request) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const { searchParams } = new URL(req.url)
    const conversationId = searchParams.get("conversationId")
    const query = searchParams.get("searchQuery") ?? searchParams.get("q") ?? ""
    if (!conversationId) return NextResponse.json({ error: "conversationId required" }, { status: 400 })
    if (!query.trim()) return NextResponse.json([])

    const limit = parseInt(searchParams.get("limit") ?? "20")
    const messages = await searchMessages(conversationId, query, limit)
    // ChatArea.tsx reads searchResults as a bare array (searchResults.map,
    // .length) — do not wrap this in an object.
    return NextResponse.json(messages)
  } catch (err) {
    return internalError(err)
  }
}
