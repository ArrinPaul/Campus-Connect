import "server-only"
import { createClient } from "@/lib/supabase/server"

async function getSupabase() {
  return await createClient()
}

export async function getTrendingHashtags(limit = 10) {
  const supabase = await getSupabase()
  const { data, error } = await supabase.from("hashtags").select("*").order("post_count", { ascending: false }).limit(limit)
  if (error) return []
  return data ?? []
}

export async function searchHashtags(query: string, limit = 10) {
  const supabase = await getSupabase()
  const { data } = await supabase.from("hashtags").select("*").ilike("tag", `%${query}%`).order("post_count", { ascending: false }).limit(limit)
  return data ?? []
}

export async function getOrCreateHashtag(tag: string) {
  const supabase = await getSupabase()
  const normalized = tag.toLowerCase().replace(/[^a-z0-9]/g, "")
  const { data: existing } = await supabase.from("hashtags").select("id, post_count").eq("tag", normalized).single()
  if (existing) return existing
  const { data } = await supabase.from("hashtags").insert({ tag: normalized, post_count: 1 }).select("id, post_count").single()
  return data
}

export async function linkPostToHashtags(postId: string, tags: string[]) {
  const supabase = await getSupabase()
  for (const tag of tags) {
    const hashtag = await getOrCreateHashtag(tag)
    if (hashtag) {
      try { await supabase.from("post_hashtags").insert({ post_id: postId, hashtag_id: hashtag.id }) } catch { /* ignore duplicate */ }
      await supabase.from("hashtags").update({ post_count: (hashtag.post_count ?? 0) + 1 }).eq("id", hashtag.id)
    }
  }
}
