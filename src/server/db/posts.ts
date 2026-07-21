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

  // Get users current user follows
  const { data: followed } = await supabase
    .from("follows")
    .select("following_id")
    .eq("follower_id", userId)
  const followedIds = new Set(followed?.map((f) => f.following_id) || [])

  // Fetch a larger pool of recent posts to rank in memory
  const poolLimit = Math.max(100, offset + limit * 2)
  const { data: posts, error } = await supabase
    .from("posts")
    .select(`
      *,
      author:users!posts_author_id_fkey(id, name, username, profile_picture, role)
    `)
    .order("created_at", { ascending: false })
    .limit(poolLimit)

  if (error || !posts) return []

  const now = new Date()
  const scoredPosts = posts.map((post) => {
    // 1. Affinity
    let affinity = 1.0
    if (post.author_id === userId) {
      affinity = 1.5
    } else if (followedIds.has(post.author_id)) {
      affinity = 2.0
    }

    // 2. Engagement Weight (likes, comments, shares)
    const likes = post.like_count || 0
    const comments = post.comment_count || 0
    const shares = post.share_count || 0
    const engagementWeight = likes + comments * 2.0 + shares * 3.0
    const engagementScore = Math.log10(1 + engagementWeight)

    // 3. Time Decay (gravity)
    const createdAt = new Date(post.created_at || now)
    const diffMs = now.getTime() - createdAt.getTime()
    const diffHours = Math.max(0, diffMs / (1000 * 60 * 60))
    const recencyScore = 1 / Math.pow(diffHours + 2, 1.5)

    const score = affinity * (1 + engagementScore) * recencyScore

    return { post, score }
  })

  // Sort descending by calculated score
  scoredPosts.sort((a, b) => b.score - a.score)

  // Paginate from the ranked list
  const paginated = scoredPosts.slice(offset, offset + limit).map((item) => item.post)
  return paginated as DbPost[]
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
  if (error || !data) {
    const { data: fallbackData } = await supabase
      .from("posts")
      .select(`
        *,
        author:users(id, name, username, profile_picture, role)
      `)
      .eq("id", postId)
      .single()
    if (fallbackData) return fallbackData as DbPost
    return null
  }
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
    .update({ content, updated_at: new Date().toISOString() })
    .eq("id", postId)
    .select(`
      *,
      author:users!posts_author_id_fkey(id, name, username, profile_picture, role)
    `)
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
    increment_by: 1,
  })
}

export async function decrementLikeCount(postId: string): Promise<void> {
  const supabase = await getSupabase()
  await supabase.rpc("increment_field", {
    table_name: "posts",
    field_name: "like_count",
    row_id: postId,
    increment_by: -1,
  })
}

export async function incrementCommentCount(postId: string): Promise<void> {
  const supabase = await getSupabase()
  await supabase.rpc("increment_field", {
    table_name: "posts",
    field_name: "comment_count",
    row_id: postId,
    increment_by: 1,
  })
}

export async function incrementShareCount(postId: string): Promise<void> {
  const supabase = await getSupabase()
  await supabase.rpc("increment_field", {
    table_name: "posts",
    field_name: "share_count",
    row_id: postId,
    increment_by: 1,
  })
}
