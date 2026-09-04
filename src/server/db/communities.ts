import "server-only"
import { createClient } from "@/lib/supabase/server"

async function getSupabase() {
  return await createClient()
}

export async function getCommunities(limit = 20, offset = 0, filters?: { category?: string; search?: string }) {
  const supabase = await getSupabase()
  let q = supabase.from("communities").select("*").order("member_count", { ascending: false })
  if (filters?.category && filters.category !== "All") q = q.eq("category", filters.category)
  if (filters?.search) {
    const escaped = filters.search.replace(/[%_]/g, (m) => `\\${m}`)
    q = q.or(`name.ilike.%${escaped}%,description.ilike.%${escaped}%`)
  }
  const { data, error } = await q.range(offset, offset + limit - 1)
  if (error) return []
  return data ?? []
}

export async function getCommunityBySlug(slug: string) {
  const supabase = await getSupabase()
  const { data, error } = await supabase.from("communities").select("*").eq("slug", slug).single()
  if (error) return null
  return data
}

export async function createCommunity(data: { name: string; slug: string; description: string; category: string; created_by: string }) {
  const supabase = await getSupabase()
  const { data: community, error } = await supabase
    .from("communities")
    .insert({ ...data, member_count: 1 })
    .select()
    .single()
  if (error || !community) return null
  await supabase.from("community_members").insert({ community_id: community.id, user_id: data.created_by, role: "admin" })
  return community
}

export async function joinCommunity(communityId: string, userId: string) {
  const supabase = await getSupabase()
  await supabase.from("community_members").insert({ community_id: communityId, user_id: userId })
  const { error: rpcErr } = await supabase.rpc("increment_field", {
    table_name: "communities",
    field_name: "member_count",
    row_id: communityId,
    increment_by: 1,
  })
  if (rpcErr) console.error(rpcErr)
}

export async function leaveCommunity(communityId: string, userId: string) {
  const supabase = await getSupabase()
  await supabase.from("community_members").delete().eq("community_id", communityId).eq("user_id", userId)
  const { error: rpcErr } = await supabase.rpc("increment_field", {
    table_name: "communities",
    field_name: "member_count",
    row_id: communityId,
    increment_by: -1,
  })
  if (rpcErr) console.error(rpcErr)
}

export async function getCommunityMembers(communityId: string) {
  const supabase = await getSupabase()
  const { data } = await supabase
    .from("community_members")
    .select("user:users!community_members_user_id_fkey(id, name, username, profile_picture, role), role, joined_at")
    .eq("community_id", communityId)
  return data ?? []
}

export async function getUserCommunities(userId: string) {
  const supabase = await getSupabase()
  const { data } = await supabase
    .from("community_members")
    .select("community:communities(*), role, joined_at")
    .eq("user_id", userId)
  return data ?? []
}

export async function inviteMember(communityId: string, inviterId: string, inviteeId: string) {
  const supabase = await getSupabase()
  await supabase.from("community_invites").insert({ community_id: communityId, inviter_id: inviterId, invitee_id: inviteeId })
}

export async function respondToInvite(inviteId: string, status: "accepted" | "declined") {
  const supabase = await getSupabase()
  const { data: invite } = await supabase.from("community_invites").update({ status }).eq("id", inviteId).select().single()
  if (invite && status === "accepted") {
    await joinCommunity(invite.community_id, invite.invitee_id)
  }
}

export async function getMyInvites(userId: string) {
  const supabase = await getSupabase()
  const { data } = await supabase
    .from("community_invites")
    .select("*, community:communities(name, slug, cover_image), inviter:users!community_invites_inviter_id_fkey(name, username)")
    .eq("invitee_id", userId)
    .eq("status", "pending")
  return data ?? []
}

export async function getMembership(communityId: string, userId: string) {
  const supabase = await getSupabase()
  const { data } = await supabase
    .from("community_members")
    .select("role")
    .eq("community_id", communityId)
    .eq("user_id", userId)
    .single()
  return data
}

async function isCommunityModerator(communityId: string, userId: string) {
  const supabase = await getSupabase()
  const { data } = await supabase
    .from("community_members")
    .select("role")
    .eq("community_id", communityId)
    .eq("user_id", userId)
    .single()
  return data?.role === "admin" || data?.role === "moderator"
}

// Approves a pending join request, recorded as a community_invites row where
// the requester invited themselves (inviter_id = invitee_id). Only a
// community admin/moderator may approve.
export async function approveMember(communityId: string, requestId: string, approverId: string) {
  const supabase = await getSupabase()
  if (!(await isCommunityModerator(communityId, approverId))) {
    return { error: "Forbidden: Only community admins/moderators can approve members", status: 403 }
  }

  const { data: request } = await supabase
    .from("community_invites")
    .select("*")
    .eq("id", requestId)
    .eq("community_id", communityId)
    .single()
  if (!request) return { error: "Join request not found", status: 404 }

  await respondToInvite(requestId, "accepted")
  return { success: true }
}

export async function removeMember(communityId: string, memberUserId: string, removerId: string) {
  const supabase = await getSupabase()
  if (!(await isCommunityModerator(communityId, removerId))) {
    return { error: "Forbidden: Only community admins/moderators can remove members", status: 403 }
  }

  const { data: target } = await supabase
    .from("community_members")
    .select("role")
    .eq("community_id", communityId)
    .eq("user_id", memberUserId)
    .single()
  if (!target) return { error: "Member not found", status: 404 }
  if (target.role === "admin") {
    return { error: "Cannot remove a community admin", status: 403 }
  }

  await leaveCommunity(communityId, memberUserId)
  return { success: true }
}

export async function updateCommunity(id: string, updates: Partial<{ name: string; description: string; type: string; category: string; slug: string }>) {
  const supabase = await getSupabase()
  
  // if name is provided, generate a new slug (basic logic)
  let updateData = { ...updates }
  if (updates.name) {
    updateData = { ...updateData, slug: updates.name.toLowerCase().replace(/[^a-z0-9]+/g, '-') }
  }

  const { data: community, error } = await supabase
    .from("communities")
    .update(updateData)
    .eq("id", id)
    .select()
    .single()
    
  if (error) throw new Error(error.message)
  return community
}
