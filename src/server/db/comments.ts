import "server-only"
import { createClient } from "@/lib/supabase/server"

export interface DbComment {
  id: string
  post_id: string
  author_id: string
  parent_id?: string
  content: string
  like_count?: number
  created_at?: string
  author?: {
    id: string
    name: string
    username?: string
    profile_picture?: string
  }
}

async function getSupabase() {
  return await createClient()
}

export async function getPostComments(
  postId: string,
  limit = 20,
  offset = 0
): Promise<DbComment[]> {
  const supabase = await getSupabase()
  const { data, error } = await supabase
    .from("comments")
    .select(`
      *,
      author:users!comments_author_id_fkey(id, name, username, profile_picture)
    `)
    .eq("post_id", postId)
    .is("parent_id", null)
    .order("created_at", { ascending: true })
    .range(offset, offset + limit - 1)
  if (error) return []
  return (data ?? []) as DbComment[]
}

export async function getReplies(
  commentId: string,
  limit = 20,
  offset = 0
): Promise<DbComment[]> {
  const supabase = await getSupabase()
  const { data, error } = await supabase
    .from("comments")
    .select(`
      *,
      author:users!comments_author_id_fkey(id, name, username, profile_picture)
    `)
    .eq("parent_id", commentId)
    .order("created_at", { ascending: true })
    .range(offset, offset + limit - 1)
  if (error) return []
  return (data ?? []) as DbComment[]
}

export async function createComment(data: {
  post_id: string
  author_id: string
  content: string
  parent_id?: string
}): Promise<DbComment | null> {
  const supabase = await getSupabase()
  const { data: comment, error } = await supabase
    .from("comments")
    .insert({
      post_id: data.post_id,
      author_id: data.author_id,
      content: data.content,
      parent_id: data.parent_id ?? null,
    })
    .select(`
      *,
      author:users!comments_author_id_fkey(id, name, username, profile_picture)
    `)
    .single()
  if (error) return null

  // Notify the post author, and separately the parent comment's author on a
  // reply — skip self-notifications and don't double-notify if both are the
  // same person.
  const { data: post } = await supabase.from("posts").select("author_id").eq("id", data.post_id).single()
  const { createNotification } = await import("@/server/db/notifications")
  const { data: actor } = await supabase.from("users").select("name").eq("id", data.author_id).single()
  const notifiedIds = new Set<string>()

  if (post && post.author_id !== data.author_id) {
    await createNotification({
      user_id: post.author_id,
      type: "comment",
      message: `${actor?.name ?? "Someone"} commented on your post`,
      reference_id: data.post_id,
      reference_type: "post",
      from_user_id: data.author_id,
    })
    notifiedIds.add(post.author_id)
  }

  if (data.parent_id) {
    const { data: parentComment } = await supabase.from("comments").select("author_id").eq("id", data.parent_id).single()
    if (parentComment && parentComment.author_id !== data.author_id && !notifiedIds.has(parentComment.author_id)) {
      await createNotification({
        user_id: parentComment.author_id,
        type: "reply",
        message: `${actor?.name ?? "Someone"} replied to your comment`,
        reference_id: data.post_id,
        reference_type: "post",
        from_user_id: data.author_id,
      })
    }
  }

  return comment as DbComment
}

export async function deleteComment(commentId: string): Promise<void> {
  const supabase = await getSupabase()
  
  // Get post id before deleting
  const { data: comment } = await supabase.from("comments").select("post_id").eq("id", commentId).single()
  
  await supabase.from("comments").delete().eq("id", commentId)
  
  if (comment?.post_id) {
    const { error: rpcErr } = await supabase.rpc("increment_field", {
      table_name: "posts",
      field_name: "comment_count",
      row_id: comment.post_id,
      increment_by: -1,
    })
    if (rpcErr) console.error(rpcErr)
  }
}
