import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"
import { getActiveCalls } from "@/server/db/misc"

// GET /api/calls/active
export async function GET() {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    const userId = user?.id
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const calls = await getActiveCalls(userId)
    return NextResponse.json(calls)
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 500 })
  }
}