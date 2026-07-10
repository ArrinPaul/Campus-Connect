import "server-only"
import { createClient } from "@/lib/supabase/server"

async function getSupabase() {
  return await createClient()
}

// ─── Polls ──────────────────────────────────────────────────────────────────

export async function createPoll(data: { question: string; options: string[]; created_by: string }) {
  const supabase = await getSupabase()
  const { data: poll, error } = await supabase.from("polls").insert({ question: data.question, options: data.options.map((o, i) => ({ index: i, text: o, votes: 0 })), created_by: data.created_by }).select().single()
  if (error) return null
  return poll
}

export async function votePoll(pollId: string, userId: string, optionIndex: number) {
  const supabase = await getSupabase()
  await supabase.from("poll_votes").insert({ poll_id: pollId, user_id: userId, option_index: optionIndex })
}

export async function getPollResults(pollId: string) {
  const supabase = await getSupabase()
  const { data: poll } = await supabase.from("polls").select("*").eq("id", pollId).single()
  const { data: votes } = await supabase.from("poll_votes").select("option_index").eq("poll_id", pollId)
  if (!poll) return null
  const counts: Record<number, number> = {}
  for (const v of votes ?? []) counts[v.option_index] = (counts[v.option_index] ?? 0) + 1
  return { ...poll, votes: counts, total_votes: votes?.length ?? 0 }
}

// ─── Reposts ────────────────────────────────────────────────────────────────

export async function repost(originalPostId: string, reposterId: string, content?: string) {
  const supabase = await getSupabase()
  const { data, error } = await supabase.from("reposts").insert({ original_post_id: originalPostId, reposter_id: reposterId, content }).select().single()
  if (error) return null
  const { data: post } = await supabase.from("posts").select("share_count").eq("id", originalPostId).single()
  if (post) await supabase.from("posts").update({ share_count: (post.share_count ?? 0) + 1 }).eq("id", originalPostId)
  return data
}

export async function undoRepost(originalPostId: string, reposterId: string) {
  const supabase = await getSupabase()
  await supabase.from("reposts").delete().eq("original_post_id", originalPostId).eq("reposter_id", reposterId)
}

export async function isReposted(postId: string, userId: string): Promise<boolean> {
  const supabase = await getSupabase()
  const { data } = await supabase.from("reposts").select("id").eq("original_post_id", postId).eq("reposter_id", userId).single()
  return !!data
}

// ─── Presence ───────────────────────────────────────────────────────────────

export async function updatePresence(userId: string, status: string) {
  const supabase = await getSupabase()
  await supabase.from("presence").upsert({ user_id: userId, status, last_seen: new Date().toISOString() })
}

export async function getUserStatuses(userIds: string[]) {
  const supabase = await getSupabase()
  const { data } = await supabase.from("presence").select("user_id, status, last_seen").in("user_id", userIds)
  return data ?? []
}

// ─── Gamification ───────────────────────────────────────────────────────────

export async function getUserStats(userId: string) {
  const supabase = await getSupabase()
  const { data } = await supabase.from("user_reputation").select("*").eq("user_id", userId).single()
  return data ?? { points: 0, level: 1, badges: [] }
}

export async function getLeaderboard(limit = 20, filters?: { period?: string; university?: string }) {
  const supabase = await getSupabase()
  let q = supabase.from("user_reputation").select("*, user:users!user_reputation_user_id_fkey(id, name, username, profile_picture, university)").order("points", { ascending: false })
  if (filters?.university) q = q.eq("user.university", filters.university)
  const { data, error } = await q.limit(limit)
  if (error) return []
  return data ?? []
}

// ─── Marketplace ────────────────────────────────────────────────────────────

export async function getListings(limit = 20, offset = 0, filters?: { category?: string }) {
  const supabase = await getSupabase()
  let q = supabase.from("marketplace_listings").select("*, seller:users!marketplace_listings_posted_by_fkey(id, name, profile_picture)").eq("status", "active").order("created_at", { ascending: false })
  if (filters?.category && filters.category !== "all") q = q.eq("category", filters.category)
  const { data, error } = await q.range(offset, offset + limit - 1)
  if (error) return []
  return data ?? []
}

export async function createListing(data: any) {
  const supabase = await getSupabase()
  const { data: listing, error } = await supabase.from("marketplace_listings").insert(data).select().single()
  if (error) return null
  return listing
}

export async function updateListing(listingId: string, data: any) {
  const supabase = await getSupabase()
  const { data: listing } = await supabase.from("marketplace_listings").update(data).eq("id", listingId).select().single()
  return listing
}

export async function deleteListing(listingId: string) {
  const supabase = await getSupabase()
  await supabase.from("marketplace_listings").delete().eq("id", listingId)
}

// ─── Calls ──────────────────────────────────────────────────────────────────

export async function initiateCall(callerId: string, recipientId: string, type: string = "video") {
  const supabase = await getSupabase()
  const { data: call, error } = await supabase
    .from("calls")
    .insert({ caller_id: callerId, recipient_id: recipientId, type, status: "ringing" })
    .select("*, caller:users!calls_caller_id_fkey(id, name, username, profile_picture), recipient:users!calls_recipient_id_fkey(id, name, username, profile_picture)")
    .single()
  if (error) return null
  return call
}

export async function updateCallStatus(callId: string, status: string) {
  const supabase = await getSupabase()
  const update: Record<string, unknown> = { status }
  if (status === "ended" || status === "rejected") {
    update.ended_at = new Date().toISOString()
  }
  await supabase.from("calls").update(update).eq("id", callId)
}

export async function getIncomingCall(userId: string) {
  const supabase = await getSupabase()
  const { data } = await supabase
    .from("calls")
    .select("*, caller:users!calls_caller_id_fkey(id, name, username, profile_picture)")
    .eq("recipient_id", userId)
    .eq("status", "ringing")
    .order("created_at", { ascending: false })
    .limit(1)
    .single()
  return data ?? null
}

export async function getActiveCalls(userId: string) {
  const supabase = await getSupabase()
  const { data } = await supabase
    .from("calls")
    .select("*, caller:users!calls_caller_id_fkey(id, name, username, profile_picture), recipient:users!calls_recipient_id_fkey(id, name, username, profile_picture)")
    .or(`caller_id.eq.${userId},recipient_id.eq.${userId}`)
    .in("status", ["ringing", "active"])
    .order("created_at", { ascending: false })
  return data ?? []
}

// ─── Search ─────────────────────────────────────────────────────────────────

export async function universalSearch(query: string) {
  const supabase = await getSupabase()
  const [users, posts, communities] = await Promise.all([
    supabase.from("users").select("id, name, username, profile_picture").or(`name.ilike.%${query}%,username.ilike.%${query}%`).limit(5),
    supabase.from("posts").select("id, content, author_id").ilike("content", `%${query}%`).limit(5),
    supabase.from("communities").select("id, name, slug, cover_image").or(`name.ilike.%${query}%,description.ilike.%${query}%`).limit(5),
  ])
  return {
    users: users.data ?? [],
    posts: posts.data ?? [],
    communities: communities.data ?? [],
  }
}
