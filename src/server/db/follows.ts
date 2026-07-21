import "server-only"
import { createClient } from "@/lib/supabase/server"
import { cacheGet, cacheSet, cacheDel } from "@/lib/redis"

async function getSupabase() {
  return await createClient()
}

// ─── Follows ────────────────────────────────────────────────────────────────

export async function followUser(followerId: string, followingId: string): Promise<void> {
  if (!followerId || !followingId || followerId === followingId) return
  const supabase = await getSupabase()
  
  // Upsert into Supabase Database table
  const { error } = await supabase.from("follows").upsert(
    { follower_id: followerId, following_id: followingId },
    { onConflict: "follower_id,following_id" }
  )

  if (error && error.code !== "23505") {
    // Retry plain insert if upsert fails
    try {
      await supabase.from("follows").insert({ follower_id: followerId, following_id: followingId })
    } catch {
      // Ignore fallback insert error
    }
  }

  // Instantly update Redis cache
  const cacheKey = `is_following:${followerId}:${followingId}`
  await cacheSet(cacheKey, true, 600)

  // Increment counts in database
  try { await supabase.rpc("increment_field", { table_name: "users", field_name: "following_count", row_id: followerId }) } catch { /* ignore */ }
  try { await supabase.rpc("increment_field", { table_name: "users", field_name: "follower_count", row_id: followingId }) } catch { /* ignore */ }
}

export async function unfollowUser(followerId: string, followingId: string): Promise<void> {
  if (!followerId || !followingId) return
  const supabase = await getSupabase()

  // Delete from Supabase Database table
  await supabase
    .from("follows")
    .delete()
    .eq("follower_id", followerId)
    .eq("following_id", followingId)

  // Instantly update Redis cache
  const cacheKey = `is_following:${followerId}:${followingId}`
  await cacheSet(cacheKey, false, 600)

  // Update counts in database
  const { data: u1 } = await supabase.from("users").select("following_count").eq("id", followerId).single()
  if (u1) await supabase.from("users").update({ following_count: Math.max(0, (u1.following_count ?? 0) - 1) }).eq("id", followerId)
  const { data: u2 } = await supabase.from("users").select("follower_count").eq("id", followingId).single()
  if (u2) await supabase.from("users").update({ follower_count: Math.max(0, (u2.follower_count ?? 0) - 1) }).eq("id", followingId)
}

export async function isFollowing(followerId: string, followingId: string): Promise<boolean> {
  if (!followerId || !followingId) return false
  const cacheKey = `is_following:${followerId}:${followingId}`

  // Check Redis / In-Memory Cache first
  const cached = await cacheGet<boolean>(cacheKey)
  if (cached !== null && cached !== undefined) {
    return cached
  }

  const supabase = await getSupabase()
  const { data } = await supabase
    .from("follows")
    .select("follower_id")
    .eq("follower_id", followerId)
    .eq("following_id", followingId)
    .limit(1)

  const result = Boolean(data && data.length > 0)
  await cacheSet(cacheKey, result, 600)
  return result
}

export async function getFollowers(userId: string, limit = 50, offset = 0): Promise<{ id: string; name: string; username?: string; profile_picture?: string }[]> {
  const supabase = await getSupabase()
  const { data } = await supabase
    .from("follows")
    .select("follower:users!follows_follower_id_fkey(id, name, username, profile_picture)")
    .eq("following_id", userId)
    .range(offset, offset + limit - 1)
  return (data?.map((d: any) => d.follower).filter(Boolean) ?? []) as any[]
}

export async function getFollowing(userId: string, limit = 50, offset = 0): Promise<{ id: string; name: string; username?: string; profile_picture?: string }[]> {
  const supabase = await getSupabase()
  const { data } = await supabase
    .from("follows")
    .select("following:users!follows_following_id_fkey(id, name, username, profile_picture)")
    .eq("follower_id", userId)
    .range(offset, offset + limit - 1)
  return (data?.map((d: any) => d.following).filter(Boolean) ?? []) as any[]
}

export async function getSuggestedUsers(userId: string, limit = 10): Promise<{ id: string; name: string; username?: string; profile_picture?: string; role?: string }[]> {
  const supabase = await getSupabase()
  const { data: following } = await supabase
    .from("follows")
    .select("following_id")
    .eq("follower_id", userId)
  const followingIds = (following?.map((f) => f.following_id) ?? []).concat([userId])
  const { data } = await supabase
    .from("users")
    .select("id, name, username, profile_picture, role")
    .not("id", "in", `(${followingIds.join(",")})`)
    .order("follower_count", { ascending: false })
    .limit(limit)
  return (data ?? []) as any[]
}
