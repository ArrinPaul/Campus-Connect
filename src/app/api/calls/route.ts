import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"
import { initiateCall } from "@/server/db/misc"

// POST /api/calls  body: { recipientId, type }
export async function POST(req: Request) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    const userId = user?.id
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const { recipientId, type } = await req.json()
    if (!recipientId) return NextResponse.json({ error: "recipientId required" }, { status: 400 })

    const call = await initiateCall(userId, recipientId, type ?? "video")
    return NextResponse.json(call)
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 500 })
  }
}

