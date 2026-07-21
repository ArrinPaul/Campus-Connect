import "server-only"
import { createClient } from "@/lib/supabase/server"

export interface DbReaction {
  id: string
  user_id: string
  target_id: string
  target_type: string
  type: string
  created_at?: string
}

async function getSupabase() {
  return await createClient()
}

export async function addReaction(data: {
  user_id: string
  target_id: string
  target_type: string
  type: string
}): Promise<DbReaction | null> {
  const supabase = await getSupabase()
  
  const { data: existing } = await supabase
    .from("reactions")
    .select("id")
    .eq("user_id", data.user_id)
    .eq("target_id", data.target_id)
    .eq("target_type", data.target_type)
    .single()

  if (existing) {
    await supabase.from("reactions").delete().eq("id", existing.id)
  }

  const { data: reaction, error } = await supabase
    .from("reactions")
    .insert({
      user_id: data.user_id,
      target_id: data.target_id,
      target_type: data.target_type,
      type: data.type,
    })
    .select()
    .single()
    
  if (error) return null

  if (!existing && data.target_type === "post") {
    const { error: rpcErr } = await supabase.rpc("increment_field", {
      table_name: "posts",
      field_name: "like_count",
      row_id: data.target_id,
      increment_by: 1,
    })
    if (rpcErr) console.error(rpcErr)
  }

  return reaction as DbReaction
}

export async function removeReaction(
  userId: string,
  targetId: string,
  targetType: string
): Promise<void> {
  const supabase = await getSupabase()
  
  const { data: existing } = await supabase
    .from("reactions")
    .select("id")
    .eq("user_id", userId)
    .eq("target_id", targetId)
    .eq("target_type", targetType)
    .single()

  if (!existing) return;

  await supabase.from("reactions").delete().eq("id", existing.id)

  if (targetType === "post") {
    const { error: rpcErr } = await supabase.rpc("increment_field", {
      table_name: "posts",
      field_name: "like_count",
      row_id: targetId,
      increment_by: -1,
    })
    if (rpcErr) console.error(rpcErr)
  }
}

export async function getUserReaction(
  userId: string,
  targetId: string,
  targetType: string
): Promise<DbReaction | null> {
  const supabase = await getSupabase()
  const { data, error } = await supabase
    .from("reactions")
    .select("*")
    .eq("user_id", userId)
    .eq("target_id", targetId)
    .eq("target_type", targetType)
    .single()
  if (error) return null
  return data as DbReaction
}

export async function getReactionCounts(
  targetId: string,
  targetType: string
): Promise<Record<string, number>> {
  const supabase = await getSupabase()
  const { data, error } = await supabase
    .from("reactions")
    .select("type")
    .eq("target_id", targetId)
    .eq("target_type", targetType)
  if (error) return {}
  const counts: Record<string, number> = {
    like: 0,
    love: 0,
    laugh: 0,
    wow: 0,
    sad: 0,
    scholarly: 0,
  }
  for (const r of data ?? []) {
    counts[r.type] = (counts[r.type] ?? 0) + 1
  }
  return counts
}
