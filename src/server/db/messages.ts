import "server-only"
import { createClient } from "@/lib/supabase/server"

async function getSupabase() {
  return await createClient()
}

// ─── Messages ───────────────────────────────────────────────────────────────

export async function getMessages(conversationId: string, limit = 50, offset = 0) {
  const supabase = await getSupabase()
  const { data, error } = await supabase
    .from("messages")
    .select("*, sender:users!messages_sender_id_fkey(id, name, username, profile_picture)")
    .eq("conversation_id", conversationId)
    .is("deleted_at", null)
    .order("created_at", { ascending: false })
    .range(offset, offset + limit - 1)
  if (error) return []
  return (data ?? []).reverse()
}

export async function sendMessage(data: {
  conversation_id: string
  sender_id: string
  content: string
  type?: string
}) {
  const supabase = await getSupabase()
  const { data: msg, error } = await supabase
    .from("messages")
    .insert({
      conversation_id: data.conversation_id,
      sender_id: data.sender_id,
      content: data.content,
      type: data.type ?? "text",
    })
    .select("*, sender:users!messages_sender_id_fkey(id, name, username, profile_picture)")
    .single()
  if (error) return null
  // Update conversation timestamp
  await supabase
    .from("conversations")
    .update({ updated_at: new Date().toISOString() })
    .eq("id", data.conversation_id)
  return msg
}

export async function deleteMessage(messageId: string) {
  const supabase = await getSupabase()
  await supabase
    .from("messages")
    .update({ deleted_at: new Date().toISOString() })
    .eq("id", messageId)
}

export async function markAsRead(conversationId: string, userId: string) {
  const supabase = await getSupabase()
  await supabase
    .from("conversation_participants")
    .update({ last_read_at: new Date().toISOString() })
    .eq("conversation_id", conversationId)
    .eq("user_id", userId)
}

// ─── Conversations ──────────────────────────────────────────────────────────

export async function getConversations(userId: string) {
  const supabase = await getSupabase()
  const { data: participants } = await supabase
    .from("conversation_participants")
    .select("conversation_id")
    .eq("user_id", userId)
  if (!participants?.length) return []
  const convIds = participants.map((p) => p.conversation_id)
  const { data } = await supabase
    .from("conversations")
    .select(`
      *,
      participants:conversation_participants(user_id, last_read_at, muted),
      last_message:messages!messages_conversation_id_fkey(content, created_at, sender_id)
    `)
    .in("id", convIds)
    .order("updated_at", { ascending: false })
  return data ?? []
}

export async function getConversationById(conversationId: string) {
  const supabase = await getSupabase()
  const { data, error } = await supabase
    .from("conversations")
    .select(`
      *,
      participants:conversation_participants(user_id, last_read_at, muted)
    `)
    .eq("id", conversationId)
    .single()
  if (error) return null
  return data
}

export async function getOrCreateDMConversation(userId1: string, userId2: string) {
  const supabase = await getSupabase()
  // Check if DM already exists
  const { data: p1 } = await supabase
    .from("conversation_participants")
    .select("conversation_id")
    .eq("user_id", userId1)
  const { data: p2 } = await supabase
    .from("conversation_participants")
    .select("conversation_id")
    .eq("user_id", userId2)
  if (p1?.length && p2?.length) {
    const common = p1
      .map((x) => x.conversation_id)
      .filter((id) => p2.some((y) => y.conversation_id === id))
    if (common.length) {
      const { data } = await supabase
        .from("conversations")
        .select("*")
        .eq("id", common[0])
        .single()
      return data
    }
  }
  // Create new DM conversation
  const { data: conv } = await supabase
    .from("conversations")
    .insert({ type: "direct", created_by: userId1 })
    .select()
    .single()
  if (!conv) return null
  await supabase.from("conversation_participants").insert([
    { conversation_id: conv.id, user_id: userId1 },
    { conversation_id: conv.id, user_id: userId2 },
  ])
  return conv
}

export async function createGroupConversation(data: {
  name: string
  createdBy: string
  participantIds: string[]
}) {
  const supabase = await getSupabase()
  const { data: conv } = await supabase
    .from("conversations")
    .insert({ type: "group", name: data.name, created_by: data.createdBy })
    .select()
    .single()
  if (!conv) return null
  const participants = [data.createdBy, ...data.participantIds].map((uid) => ({
    conversation_id: conv.id,
    user_id: uid,
  }))
  await supabase.from("conversation_participants").insert(participants)
  return conv
}

export async function leaveConversation(conversationId: string, userId: string) {
  const supabase = await getSupabase()
  await supabase
    .from("conversation_participants")
    .delete()
    .eq("conversation_id", conversationId)
    .eq("user_id", userId)
}

export async function toggleMute(conversationId: string, userId: string, muted: boolean) {
  const supabase = await getSupabase()
  await supabase
    .from("conversation_participants")
    .update({ muted })
    .eq("conversation_id", conversationId)
    .eq("user_id", userId)
}

export async function getUnreadCount(conversationId: string, userId: string): Promise<number> {
  const supabase = await getSupabase()
  const { data: participant } = await supabase
    .from("conversation_participants")
    .select("last_read_at")
    .eq("conversation_id", conversationId)
    .eq("user_id", userId)
    .single()
  if (!participant) return 0
  const { count } = await supabase
    .from("messages")
    .select("*", { count: "exact", head: true })
    .eq("conversation_id", conversationId)
    .gt("created_at", participant.last_read_at)
    .neq("sender_id", userId)
  return count ?? 0
}
