import { createClient } from "@/lib/supabase/server"
import { internalError } from "@/lib/api-error"
import { NextResponse } from "next/server"
import { getIncomingCall } from "@/server/db/misc"

// GET /api/calls/incoming
export async function GET() {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    const userId = user?.id
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const call = await getIncomingCall(userId)
    return NextResponse.json(call)
  } catch (err) {
    return internalError(err)
  }
}