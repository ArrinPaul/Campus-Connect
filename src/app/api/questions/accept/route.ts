import { createClient } from "@/lib/supabase/server"
import { internalError } from "@/lib/api-error"
import { NextResponse } from "next/server"
import { acceptAnswer } from "@/server/db/content"

// POST /api/questions/accept  body: { answerId }
export async function POST(req: Request) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    const userId = user?.id
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const body = await req.json().catch(() => ({}));
    const { answerId } = body;
    if (!answerId) {
      return NextResponse.json({ error: "answerId required" }, { status: 400 })
    }

    const result = await acceptAnswer(answerId)
    if (!result) {
        return NextResponse.json({ error: "Failed to accept answer" }, { status: 500 })
    }
    
    return NextResponse.json({ success: true })
  } catch (err) {
    return internalError(err)
  }
}