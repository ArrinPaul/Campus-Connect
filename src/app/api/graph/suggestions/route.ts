import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function GET(req: Request) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const { searchParams } = new URL(req.url)
    const limit = Number(searchParams.get("limit") ?? "5")

    // Very basic Postgres-based recommendation: 
    // Fetch users ordered by follower_count, excluding self and already followed
    
    // First, get users we are already following
    const { data: following } = await supabase
      .from("follows")
      .select("following_id")
      .eq("follower_id", user.id)
      
    const followingIds = following?.map(f => f.following_id) || []
    followingIds.push(user.id) // exclude self

    // Now get suggestions
    const { data: suggestions, error } = await supabase
      .from("users")
      .select("id, name, username, profile_picture, bio")
      .not('id', 'in', `(${followingIds.join(',')})`)
      .order("follower_count", { ascending: false })
      .limit(limit)

    if (error) throw error

    // Map to expected GraphSuggestion format
    const formatted = suggestions.map(s => ({
      _id: s.id,
      user: {
        id: s.id,
        authId: s.id,
        name: s.name,
        username: s.username,
        profilePicture: s.profile_picture,
        bio: s.bio
      },
      reasons: ["Popular on Campus Connect"],
      score: 100
    }))

    return NextResponse.json(formatted)
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 500 })
  }
}
