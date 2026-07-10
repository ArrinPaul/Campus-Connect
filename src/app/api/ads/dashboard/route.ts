import { auth } from "@/lib/auth/client"
import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

// GET /api/ads/dashboard
export async function GET() {
  try {
    const { userId } = await auth()
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const supabase = await createClient()
    const { data, error } = await supabase
      .from("ads")
      .select("*")
      .eq("created_by", userId)
      .order("created_at", { ascending: false })
    if (error) throw error
    return NextResponse.json(data ?? [])
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 500 })
  }
}
