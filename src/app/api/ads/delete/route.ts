import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

// DELETE /api/ads/delete  body: { adId: string }
export async function DELETE(req: Request) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    const userId = user?.id
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const { adId } = await req.json().catch(() => ({}))
    if (!adId) return NextResponse.json({ error: "adId required" }, { status: 400 })

    const { error } = await supabase
      .from("ads")
      .delete()
      .eq("id", adId)
      .eq("created_by", userId) // ensure only owner can delete

    if (error) throw error
    return NextResponse.json({ success: true })
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 500 })
  }
}
