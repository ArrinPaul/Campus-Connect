import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { updateCommunity } from "@/server/db/communities"

export async function PATCH(req: Request) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const body = await req.json()
    const { communityId, name, description, type, category } = body

    if (!communityId) return NextResponse.json({ error: "Missing communityId" }, { status: 400 })

    // Check if user is admin
    const { data: membership } = await supabase
      .from("community_members")
      .select("role")
      .eq("community_id", communityId)
      .eq("user_id", user.id)
      .single()

    if (!membership || (membership.role !== 'admin' && membership.role !== 'owner')) {
        return NextResponse.json({ error: "Forbidden: Not an admin" }, { status: 403 })
    }

    const updated = await updateCommunity(communityId, { name, description, type, category })
    return NextResponse.json(updated)
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 500 })
  }
}