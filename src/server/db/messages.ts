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
  let convId = data.conversation_id

  // 1. Ensure conversation exists in DB table
  const { data: existingConv } = await supabase
    .from("conversations")
    .select("id")
    .eq("id", convId)
    .limit(1)

  if (!existingConv || existingConv.length === 0) {
    const { data: newConvs } = await supabase
      .from("conversations")
      .insert({ type: "direct", created_by: data.sender_id })
      .select()
    
    if (newConvs?.[0]) {
      convId = newConvs[0].id
      if (data.conversation_id.startsWith("dm_")) {
        const parts = data.conversation_id.replace("dm_", "").split("_")
        const targetUserId = parts.find((p) => p !== data.sender_id) || parts[1] || parts[0]
        try {
          await supabase.from("conversation_participants").insert([
            { conversation_id: convId, user_id: data.sender_id },
            { conversation_id: convId, user_id: targetUserId },
          ])
        } catch { /* ignore */ }
      }
    }
  }

  // 2. Insert message
  const { data: msgs, error } = await supabase
    .from("messages")
    .insert({
      conversation_id: convId,
      sender_id: data.sender_id,
      content: data.content,
      type: data.type ?? "text",
    })
    .select("*, sender:users!messages_sender_id_fkey(id, name, username, profile_picture)")

  const msg = msgs?.[0]
  if (error || !msg) {
    // Retry plain insert without relation select
    const { data: rawMsgs } = await supabase
      .from("messages")
      .insert({
        conversation_id: convId,
        sender_id: data.sender_id,
        content: data.content,
        type: data.type ?? "text",
      })
      .select()
    const rawMsg = rawMsgs?.[0]
    if (rawMsg) {
      await notifyOtherParticipants(supabase, convId, data.sender_id, data.content)
      return { ...rawMsg, _id: rawMsg.id }
    }
    return null
  }

  // Update conversation timestamp asynchronously
  supabase
    .from("conversations")
    .update({ updated_at: new Date().toISOString() })
    .eq("id", convId)
    .then(() => null, () => null)

  await notifyOtherParticipants(supabase, convId, data.sender_id, data.content)

  return { ...msg, _id: msg.id }
}

// Notifies every other participant in the conversation that a new message
// arrived. Best-effort — a notification failure should never block the
// message itself from having been sent.
async function notifyOtherParticipants(
  supabase: Awaited<ReturnType<typeof getSupabase>>,
  conversationId: string,
  senderId: string,
  content: string
) {
  try {
    const { data: participants } = await supabase
      .from("conversation_participants")
      .select("user_id")
      .eq("conversation_id", conversationId)
      .neq("user_id", senderId)
    if (!participants || participants.length === 0) return

    const { data: sender } = await supabase.from("users").select("name").eq("id", senderId).single()
    const { createNotification } = await import("@/server/db/notifications")
    const preview = content.length > 80 ? `${content.slice(0, 80)}…` : content

    for (const p of participants) {
      await createNotification({
        user_id: p.user_id,
        type: "message",
        message: `${sender?.name ?? "Someone"}: ${preview}`,
        reference_id: conversationId,
        reference_type: "conversation",
        from_user_id: senderId,
      })
    }
  } catch {
    // Notification failure must never fail message delivery.
  }
}

export async function searchMessages(conversationId: string, query: string, limit = 20) {
  const supabase = await getSupabase()
  const escaped = query.replace(/[%_]/g, (m) => `\\${m}`)
  const { data, error } = await supabase
    .from("messages")
    .select("*, sender:users!messages_sender_id_fkey(id, name, username, profile_picture)")
    .eq("conversation_id", conversationId)
    .is("deleted_at", null)
    .ilike("content", `%${escaped}%`)
    .order("created_at", { ascending: false })
    .limit(limit)
  if (error) return []
  return data ?? []
}

// Removes the current user from a conversation (leaves it) rather than
// deleting the conversation for every participant — matches how the group
// "leave" flow and DM etiquette both expect this to behave.
export async function deleteConversationForUser(conversationId: string, userId: string) {
  const supabase = await getSupabase()
  const { error } = await supabase
    .from("conversation_participants")
    .delete()
    .eq("conversation_id", conversationId)
    .eq("user_id", userId)
  if (error) return { error: error.message, status: 500 }
  return { success: true }
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

  // 1. Get all conversation IDs user is a participant in, created, or sent messages to
  const [pListRes, createdRes, sentMsgsRes] = await Promise.all([
    supabase.from("conversation_participants").select("conversation_id").eq("user_id", userId),
    supabase.from("conversations").select("id").eq("created_by", userId),
    supabase.from("messages").select("conversation_id").eq("sender_id", userId)
  ])

  const convIds = Array.from(new Set([
    ...(pListRes.data || []).map((p) => p.conversation_id),
    ...(createdRes.data || []).map((c) => c.id),
    ...(sentMsgsRes.data || []).map((m) => m.conversation_id)
  ])).filter(Boolean)

  if (convIds.length === 0) return []

  // 2. Fetch conversations, participants, and messages concurrently
  const [convsRes, allPartsRes, messagesRes] = await Promise.all([
    supabase
      .from("conversations")
      .select("*")
      .in("id", convIds)
      .order("updated_at", { ascending: false }),
    supabase
      .from("conversation_participants")
      .select("conversation_id, user_id, last_read_at, muted")
      .in("conversation_id", convIds),
    supabase
      .from("messages")
      .select("conversation_id, content, created_at, sender_id")
      .in("conversation_id", convIds)
      .is("deleted_at", null)
      .order("created_at", { ascending: false })
  ])

  const existingConvIds = new Set((convsRes.data || []).map((c) => c.id))
  let convs = [...(convsRes.data || [])]

  // Guarantee all convIds are included, even if missing from conversations table
  convIds.forEach((cid) => {
    if (!existingConvIds.has(cid)) {
      convs.push({
        id: cid,
        type: "direct",
        created_by: userId,
        updated_at: new Date().toISOString(),
      })
    }
  })

  const rawParticipants = allPartsRes.data || []
  const messages = messagesRes.data || []

  // Batch query user profiles
  const allUserIds = Array.from(new Set([userId, ...rawParticipants.map((p) => p.user_id)]))
  const { data: userRows } = await supabase
    .from("users")
    .select("id, name, username, profile_picture")
    .in("id", allUserIds)

  const usersMap = new Map<string, any>()
  userRows?.forEach((u) => usersMap.set(u.id, u))

  // Map participants with user info
  const participantsByConv = new Map<string, any[]>()
  rawParticipants.forEach((p) => {
    if (!participantsByConv.has(p.conversation_id)) {
      participantsByConv.set(p.conversation_id, [])
    }
    const u = usersMap.get(p.user_id)
    participantsByConv.get(p.conversation_id)!.push({
      ...p,
      user: u || { id: p.user_id, name: "User", username: "", profile_picture: undefined }
    })
  })

  const lastMessageByConv = new Map<string, any>()
  messages.forEach((m) => {
    if (!lastMessageByConv.has(m.conversation_id)) {
      lastMessageByConv.set(m.conversation_id, m)
    }
  })

  // Real per-conversation unread counts (not just an is-there-anything-new
  // boolean) — count every message from someone else, newer than my
  // last_read_at for that conversation.
  const myLastReadByConv = new Map<string, number>()
  participantsByConv.forEach((parts, convId) => {
    const mine = parts.find((p: any) => p.user_id === userId)
    myLastReadByConv.set(convId, mine?.last_read_at ? new Date(mine.last_read_at).getTime() : 0)
  })
  const unreadCountByConv = new Map<string, number>()
  messages.forEach((m) => {
    if (m.sender_id === userId) return
    const lastRead = myLastReadByConv.get(m.conversation_id) ?? 0
    if (new Date(m.created_at).getTime() > lastRead) {
      unreadCountByConv.set(m.conversation_id, (unreadCountByConv.get(m.conversation_id) ?? 0) + 1)
    }
  })

  // Format conversations
  const formatted = convs.map((conv) => {
    const parts = participantsByConv.get(conv.id) || []
    const mappedParts = parts.map((p: any) => {
      const u = p.user
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
    let otherUser = null
    if (otherPartRaw) {
      const ou = otherPartRaw.user
      otherUser = {
        _id: ou?.id || otherPartRaw.user_id,
        id: ou?.id || otherPartRaw.user_id,
        name: ou?.name || "User",
        profilePicture: ou?.profile_picture,
        profile_picture: ou?.profile_picture,
        username: ou?.username || "",
      }
    } else if (conv.id.startsWith("dm_")) {
      const partsArr = conv.id.replace("dm_", "").split("_")
      const otherId = partsArr.find((idStr: string) => idStr !== userId) || partsArr[1] || partsArr[0]
      const ou = usersMap.get(otherId)
      otherUser = {
        _id: ou?.id || otherId,
        id: ou?.id || otherId,
        name: ou?.name || "User",
        profilePicture: ou?.profile_picture,
        profile_picture: ou?.profile_picture,
        username: ou?.username || "",
      }
    } else {
      otherUser = {
        _id: userId,
        id: userId,
        name: "Self",
        profilePicture: undefined,
        profile_picture: undefined,
        username: "",
      }
    }

    const lastMsg = lastMessageByConv.get(conv.id)
    const unreadCount = unreadCountByConv.get(conv.id) ?? 0

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

  return formatted
}

export async function getConversationById(conversationId: string) {
  const supabase = await getSupabase()

  const [convRes, partsRes, msgsRes] = await Promise.all([
    supabase.from("conversations").select("*").eq("id", conversationId).single(),
    supabase.from("conversation_participants").select("conversation_id, user_id, last_read_at, muted").eq("conversation_id", conversationId),
    supabase.from("messages").select("content, created_at, sender_id").eq("conversation_id", conversationId).is("deleted_at", null).order("created_at", { ascending: false }).limit(1)
  ])

  const conv = convRes.data
  if (!conv) return null

  const parts = partsRes.data || []
  const lastMsg = msgsRes.data?.[0]

  const partUserIds = parts.map((p) => p.user_id)
  const { data: userRows } = await supabase
    .from("users")
    .select("id, name, username, profile_picture")
    .in("id", partUserIds.length > 0 ? partUserIds : [conv.created_by])

  const usersMap = new Map<string, any>()
  userRows?.forEach((u) => usersMap.set(u.id, u))

  const mappedParts = parts.map((p: any) => {
    const u = usersMap.get(p.user_id)
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

  const otherPartRaw = parts.find((p: any) => p.user_id !== conv.created_by) || parts[0]
  const ou = otherPartRaw ? usersMap.get(otherPartRaw.user_id) : null
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
  if (!userId1 || !userId2) return null
  const supabase = await getSupabase()

  try {
    // 1. Check existing DM with 1 batch query
    const { data: p1 } = await supabase
      .from("conversation_participants")
      .select("conversation_id")
      .eq("user_id", userId1)

    if (p1?.length) {
      const myConvIds = p1.map((x) => x.conversation_id)
      const [sharedRes, convsRes] = await Promise.all([
        supabase
          .from("conversation_participants")
          .select("conversation_id")
          .in("conversation_id", myConvIds)
          .eq("user_id", userId2),
        supabase
          .from("conversations")
          .select("*")
          .in("id", myConvIds)
      ])

      const sharedConvIds = new Set((sharedRes.data || []).map((s) => s.conversation_id))
      const directConv = (convsRes.data || []).find((c) => sharedConvIds.has(c.id) && (c.type === "direct" || !c.type))
      if (directConv) return directConv
    }

    // 2. Fast Insert
    const { data: convs } = await supabase
      .from("conversations")
      .insert({ type: "direct", created_by: userId1 })
      .select()

    const conv = convs?.[0] || {
      id: `dm_${userId1}_${userId2}`,
      _id: `dm_${userId1}_${userId2}`,
      type: "direct",
      created_by: userId1,
    }

    if (conv.id && !conv.id.startsWith("dm_")) {
      supabase
        .from("conversation_participants")
        .insert([
          { conversation_id: conv.id, user_id: userId1 },
          { conversation_id: conv.id, user_id: userId2 },
        ])
        .then(() => null, () => null)
    }

    return conv
  } catch (err) {
    console.error("Error in getOrCreateDMConversation:", err)
    return {
      id: `dm_${userId1}_${userId2}`,
      _id: `dm_${userId1}_${userId2}`,
      type: "direct",
      created_by: userId1,
    }
  }
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
