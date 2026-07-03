import "server-only"
import { createClient } from "@/lib/supabase/server"

export interface DbPost {
  id: string
  author_id: string
  content: string
  like_count?: number
  comment_count?: number
  share_count?: number
  bookmark_count?: number
  media_urls?: string[]
  media_type?: string
  link_preview?: Record<string, unknown>
  community_id?: string
  poll_id?: string
  created_at?: string
  updated_at?: string
  // Joined fields
  author?: {
    id: string
    name: string
    username?: string
    profile_picture?: string
    role?: string
  }
}

async function getSupabase() {
  return await createClient()
}

// ─── Read ───────────────────────────────────────────────────────────────────

export async function getFeedPosts(
  userId: string,
  limit = 20,
  offset = 0
): Promise<DbPost[]> {
  const supabase = await getSupabase()
  const { data, error } = await supabase
    .from("posts")
    .select(`
      *,
      author:users!posts_author_id_fkey(id, name, username, profile_picture, role)
    `)
    .order("created_at", { ascending: false })
    .range(offset, offset + limit - 1)
  if (error) return []
  return (data ?? []) as DbPost[]
}

export async function getPostById(postId: string): Promise<DbPost | null> {
  const supabase = await getSupabase()
  const { data, error } = await supabase
    .from("posts")
    .select(`
      *,
      author:users!posts_author_id_fkey(id, name, username, profile_picture, role)
    `)
    .eq("id", postId)
    .single()
  if (error) return null
  return data as DbPost
}

export async function getUserPosts(
  userId: string,
  limit = 20,
  offset = 0
): Promise<DbPost[]> {
  const supabase = await getSupabase()
  const { data, error } = await supabase
    .from("posts")
    .select(`
      *,
      author:users!posts_author_id_fkey(id, name, username, profile_picture, role)
    `)
    .eq("author_id", userId)
    .order("created_at", { ascending: false })
    .range(offset, offset + limit - 1)
  if (error) return []
  return (data ?? []) as DbPost[]
}

export async function getExplorePosts(
  limit = 20,
  offset = 0
): Promise<DbPost[]> {
  const supabase = await getSupabase()
  const { data, error } = await supabase
    .from("posts")
    .select(`
      *,
      author:users!posts_author_id_fkey(id, name, username, profile_picture, role)
    `)
    .order("like_count", { ascending: false })
    .range(offset, offset + limit - 1)
  if (error) return []
  return (data ?? []) as DbPost[]
}

export async function getPostsByCommunity(
  communityId: string,
  limit = 20,
  offset = 0
): Promise<DbPost[]> {
  const supabase = await getSupabase()
  const { data, error } = await supabase
    .from("posts")
    .select(`
      *,
      author:users!posts_author_id_fkey(id, name, username, profile_picture, role)
    `)
    .eq("community_id", communityId)
    .order("created_at", { ascending: false })
    .range(offset, offset + limit - 1)
  if (error) return []
  return (data ?? []) as DbPost[]
}

export async function getPostsByHashtag(
  hashtag: string,
  limit = 20,
  offset = 0
): Promise<DbPost[]> {
  const supabase = await getSupabase()
  const { data: hashtagRow } = await supabase
    .from("hashtags")
    .select("id")
    .eq("tag", hashtag)
    .single()
  if (!hashtagRow) return []
  const { data: postHashtags } = await supabase
    .from("post_hashtags")
    .select("post_id")
    .eq("hashtag_id", hashtagRow.id)
    .range(offset, offset + limit - 1)
  if (!postHashtags?.length) return []
  const postIds = postHashtags.map((ph) => ph.post_id)
  const { data, error } = await supabase
    .from("posts")
    .select(`
      *,
      author:users!posts_author_id_fkey(id, name, username, profile_picture, role)
    `)
    .in("id", postIds)
    .order("created_at", { ascending: false })
  if (error) return []
  return (data ?? []) as DbPost[]
}

// ─── Create ─────────────────────────────────────────────────────────────────

export async function createPost(data: {
  author_id: string
  content: string
  media_urls?: string[]
  media_type?: string
  community_id?: string
  poll_id?: string
}): Promise<DbPost | null> {
  const supabase = await getSupabase()
  const { data: post, error } = await supabase
    .from("posts")
    .insert({
      author_id: data.author_id,
      content: data.content,
      media_urls: data.media_urls ?? [],
      media_type: data.media_type ?? null,
      community_id: data.community_id ?? null,
      poll_id: data.poll_id ?? null,
    })
    .select(`
      *,
      author:users!posts_author_id_fkey(id, name, username, profile_picture, role)
    `)
    .single()
  if (error) return null
  return post as DbPost
}

// ─── Update ─────────────────────────────────────────────────────────────────

export async function updatePost(
  postId: string,
  content: string
): Promise<DbPost | null> {
  const supabase = await getSupabase()
  const { data, error } = await supabase
    .from("posts")
    .update({ content })
    .eq("id", postId)
    .select()
    .single()
  if (error) return null
  return data as DbPost
}

// ─── Delete ─────────────────────────────────────────────────────────────────

export async function deletePost(postId: string): Promise<void> {
  const supabase = await getSupabase()
  await supabase.from("posts").delete().eq("id", postId)
}

// ─── Counters ───────────────────────────────────────────────────────────────

export async function incrementLikeCount(postId: string): Promise<void> {
  const supabase = await getSupabase()
  await supabase.rpc("increment_field", {
    table_name: "posts",
    field_name: "like_count",
    row_id: postId,
  }).catch(() => {
    // Fallback: manual increment
    supabase
      .from("posts")
      .select("like_count")
      .eq("id", postId)
      .single()
      .then(({ data }) => {
        if (data) {
          supabase
            .from("posts")
            .update({ like_count: (data.like_count ?? 0) + 1 })
            .eq("id", postId)
        }
      })
  })
}

export async function decrementLikeCount(postId: string): Promise<void> {
  const supabase = await getSupabase()
  const { data } = await supabase
    .from("posts")
    .select("like_count")
    .eq("id", postId)
    .single()
  if (data) {
    await supabase
      .from("posts")
      .update({ like_count: Math.max(0, (data.like_count ?? 0) - 1) })
      .eq("id", postId)
  }
}

export async function incrementCommentCount(postId: string): Promise<void> {
  const supabase = await getSupabase()
  const { data } = await supabase
    .from("posts")
    .select("comment_count")
    .eq("id", postId)
    .single()
  if (data) {
    await supabase
      .from("posts")
      .update({ comment_count: (data.comment_count ?? 0) + 1 })
      .eq("id", postId)
  }
}

export async function incrementShareCount(postId: string): Promise<void> {
  const supabase = await getSupabase()
  const { data } = await supabase
    .from("posts")
    .select("share_count")
    .eq("id", postId)
    .single()
  if (data) {
    await supabase
      .from("posts")
      .update({ share_count: (data.share_count ?? 0) + 1 })
      .eq("id", postId)
  }
}
