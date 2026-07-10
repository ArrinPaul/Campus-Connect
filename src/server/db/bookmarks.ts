import "server-only"
import { createClient } from "@/lib/supabase/server"

async function getSupabase() {
  return await createClient()
}

export async function addBookmark(userId: string, postId: string, collectionName = "default") {
  const supabase = await getSupabase()
  const { data, error } = await supabase.from("bookmarks").insert({ user_id: userId, post_id: postId, collection_name: collectionName }).select().single()
  if (error) return null
  return data
}

export async function removeBookmark(userId: string, postId: string) {
  const supabase = await getSupabase()
  await supabase.from("bookmarks").delete().eq("user_id", userId).eq("post_id", postId)
}

export async function getBookmarks(userId: string, limit = 20, offset = 0) {
  const supabase = await getSupabase()
  const { data, error } = await supabase
    .from("bookmarks")
    .select("*, post:posts(*, author:users!posts_author_id_fkey(id, name, username, profile_picture))")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .range(offset, offset + limit - 1)
  if (error) return []
  return data ?? []
}

export async function isBookmarked(userId: string, postId: string): Promise<boolean> {
  const supabase = await getSupabase()
  const { data } = await supabase.from("bookmarks").select("id").eq("user_id", userId).eq("post_id", postId).single()
  return !!data
}

export async function getBookmarkCollections(userId: string) {
  const supabase = await getSupabase()
  const { data } = await supabase.from("bookmarks").select("collection_name").eq("user_id", userId)
  const unique = Array.from(new Set((data ?? []).map((b: any) => b.collection_name)))
  return unique
}
