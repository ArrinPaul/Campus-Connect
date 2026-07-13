import { NextResponse } from "next/server"
import { internalError } from "@/lib/api-error"
import { createClient } from "@/lib/supabase/server"
// GET /api/ads/dashboard
export async function GET() {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    const userId = user?.id
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const { data, error } = await supabase
      .from("ads")
      .select("*")
      .eq("created_by", userId)
      .order("created_at", { ascending: false })
    if (error) throw error
    return NextResponse.json(data ?? [])
  } catch (err) {
    return internalError(err)
  }
}
