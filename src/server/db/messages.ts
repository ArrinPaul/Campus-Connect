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

  // 1. Get all conversation IDs user is a participant in
  const { data: pList, error: pListErr } = await supabase
    .from("conversation_participants")
    .select("conversation_id")
    .eq("user_id", userId)

  if (pListErr || !pList?.length) return []
  const convIds = pList.map((p) => p.conversation_id)

  // 2. Fetch the conversations themselves
  const { data: convs, error: convsErr } = await supabase
    .from("conversations")
    .select("*")
    .in("id", convIds)
    .order("updated_at", { ascending: false })

  if (convsErr || !convs) return []

  // 3. For all these conversation IDs, fetch participants and their user details
  const { data: allParticipants } = await supabase
    .from("conversation_participants")
    .select(`
      conversation_id,
      user_id,
      last_read_at,
      muted,
      user:users!conversation_participants_user_id_fkey(id, name, username, profile_picture)
    `)
    .in("conversation_id", convIds)

  // 4. For all these conversation IDs, fetch messages
  const { data: messages } = await supabase
    .from("messages")
    .select("conversation_id, content, created_at, sender_id")
    .in("conversation_id", convIds)
    .is("deleted_at", null)
    .order("created_at", { ascending: false })

  // Map participants and last messages by conversation_id for fast lookup
  const participantsByConv = new Map<string, any[]>()
  allParticipants?.forEach((p) => {
    if (!participantsByConv.has(p.conversation_id)) {
      participantsByConv.set(p.conversation_id, [])
    }
    participantsByConv.get(p.conversation_id)!.push(p)
  })

  const lastMessageByConv = new Map<string, any>()
  messages?.forEach((m) => {
    if (!lastMessageByConv.has(m.conversation_id)) {
      lastMessageByConv.set(m.conversation_id, m)
    }
  })

  // 5. Calculate unreadCount for each conversation and format
  const formatted = await Promise.all(
    convs.map(async (conv) => {
      const parts = participantsByConv.get(conv.id) || []
      const mappedParts = parts.map((p: any) => {
        const u = Array.isArray(p.user) ? p.user[0] : p.user
        return {
          _id: u?.id || p.user_id,
          id: u?.id || p.user_id,
          name: u?.name || "User",
          username: u?.username || "",
          profilePicture: u?.profile_picture,
          profile_picture: u?.profile_picture,
          last_read_at: p.last_read_at,
          muted: p.muted,
        }
      })

      const otherPartRaw = parts.find((p: any) => p.user_id !== userId)
      const ou = otherPartRaw ? (Array.isArray(otherPartRaw.user) ? otherPartRaw.user[0] : otherPartRaw.user) : null
      const otherUser = otherPartRaw
        ? {
            _id: ou?.id || otherPartRaw.user_id,
            id: ou?.id || otherPartRaw.user_id,
            name: ou?.name || "User",
            profilePicture: ou?.profile_picture,
            profile_picture: ou?.profile_picture,
            username: ou?.username || "",
          }
        : {
            _id: userId,
            id: userId,
            name: "Self",
            profilePicture: undefined,
            profile_picture: undefined,
            username: "",
          }

      const lastMsg = lastMessageByConv.get(conv.id)
      const unreadCount = await getUnreadCount(conv.id, userId)

      return {
        _id: conv.id,
        id: conv.id,
        type: conv.type,
        name: conv.name,
        created_by: conv.created_by,
        created_at: conv.created_at,
        updated_at: conv.updated_at,
        updatedAt: new Date(conv.updated_at).getTime(),
        lastMessage: lastMsg?.content || "",
        last_message: lastMsg
          ? {
              content: lastMsg.content,
              created_at: lastMsg.created_at,
              sender_id: lastMsg.sender_id,
            }
          : undefined,
        participants: mappedParts,
        otherUser,
        unreadCount,
      }
    })
  )

  return formatted
}

export async function getConversationById(conversationId: string) {
  const supabase = await getSupabase()

  // 1. Fetch the conversation itself
  const { data: conv, error: convsErr } = await supabase
    .from("conversations")
    .select("*")
    .eq("id", conversationId)
    .single()

  if (convsErr || !conv) return null

  // 2. Fetch participants and their user details
  const { data: parts } = await supabase
    .from("conversation_participants")
    .select(`
      conversation_id,
      user_id,
      last_read_at,
      muted,
      user:users!conversation_participants_user_id_fkey(id, name, username, profile_picture)
    `)
    .eq("conversation_id", conversationId)

  // 3. Fetch the last message
  const { data: messages } = await supabase
    .from("messages")
    .select("content, created_at, sender_id")
    .eq("conversation_id", conversationId)
    .is("deleted_at", null)
    .order("created_at", { ascending: false })
    .limit(1)

  const lastMsg = messages?.[0]

  const mappedParts = (parts ?? []).map((p: any) => {
    const u = Array.isArray(p.user) ? p.user[0] : p.user
    return {
      _id: u?.id || p.user_id,
      id: u?.id || p.user_id,
      name: u?.name || "User",
      username: u?.username || "",
      profilePicture: u?.profile_picture,
      profile_picture: u?.profile_picture,
      last_read_at: p.last_read_at,
      muted: p.muted,
    }
  })

  const otherPartRaw = (parts ?? []).find((p: any) => p.user_id !== conv.created_by) || (parts ?? [])[0]
  const ou = otherPartRaw ? (Array.isArray(otherPartRaw.user) ? otherPartRaw.user[0] : otherPartRaw.user) : null
  const otherUser = otherPartRaw
    ? {
        _id: ou?.id || otherPartRaw.user_id,
        id: ou?.id || otherPartRaw.user_id,
        name: ou?.name || "User",
        profilePicture: ou?.profile_picture,
        profile_picture: ou?.profile_picture,
        username: ou?.username || "",
      }
    : null

  return {
    _id: conv.id,
    id: conv.id,
    type: conv.type,
    name: conv.name,
    created_by: conv.created_by,
    created_at: conv.created_at,
    updated_at: conv.updated_at,
    updatedAt: new Date(conv.updated_at).getTime(),
    lastMessage: lastMsg?.content || "",
    last_message: lastMsg || undefined,
    participants: mappedParts,
    otherUser,
  }
}

export async function getOrCreateDMConversation(userId1: string, userId2: string) {
  const supabase = await getSupabase()

  // Find existing DM by joining both users' participants in a single query
  const { data: p1 } = await supabase
    .from("conversation_participants")
    .select("conversation_id")
    .eq("user_id", userId1)

  if (p1?.length) {
    const convIds = p1.map((x) => x.conversation_id)
    // Find conversations where both users are participants
    const { data: shared } = await supabase
      .from("conversation_participants")
      .select("conversation_id")
      .in("conversation_id", convIds)
      .eq("user_id", userId2)

    if (shared?.length) {
      // Get the most recent DM (in case of duplicates from race conditions)
      const sharedIds = shared.map((s) => s.conversation_id)
      const { data: conv } = await supabase
        .from("conversations")
        .select("*")
        .eq("type", "direct")
        .in("id", sharedIds)
        .order("created_at", { ascending: false })
        .limit(1)
        .single()
      if (conv) return conv
    }
  }

  // Create new DM conversation
  const { data: conv } = await supabase
    .from("conversations")
    .insert({ type: "direct", created_by: userId1 })
    .select()
    .single()
  if (!conv) return null

  // Insert both participants — if race creates duplicate, the DB unique constraint catches it
  const { error } = await supabase.from("conversation_participants").insert([
    { conversation_id: conv.id, user_id: userId1 },
    { conversation_id: conv.id, user_id: userId2 },
  ])

  // If insert failed (duplicate from race), find the existing conversation
  if (error) {
    const { data: existing } = await supabase
      .from("conversation_participants")
      .select("conversation_id")
      .eq("user_id", userId2)
    if (existing?.length) {
      const { data: retryConv } = await supabase
        .from("conversations")
        .select("*")
        .eq("type", "direct")
        .in("id", existing.map((e) => e.conversation_id))
        .order("created_at", { ascending: false })
        .limit(1)
        .single()
      if (retryConv) return retryConv
    }
    return null
  }

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
