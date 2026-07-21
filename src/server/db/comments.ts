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
