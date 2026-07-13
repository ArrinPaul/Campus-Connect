import "server-only"
import { createClient } from "@/lib/supabase/server"

async function getSupabase() {
  return await createClient()
}

export async function getCommunities(limit = 20, offset = 0, filters?: { category?: string; search?: string }) {
  const supabase = await getSupabase()
  let q = supabase.from("communities").select("*").order("member_count", { ascending: false })
  if (filters?.category && filters.category !== "All") q = q.eq("category", filters.category)
  if (filters?.search) q = q.or(`name.ilike.%${filters.search}%,description.ilike.%${filters.search}%`)
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
  const { data } = await supabase.from("communities").select("member_count").eq("id", communityId).single()
  if (data) await supabase.from("communities").update({ member_count: (data.member_count ?? 0) + 1 }).eq("id", communityId)
}

export async function leaveCommunity(communityId: string, userId: string) {
  const supabase = await getSupabase()
  await supabase.from("community_members").delete().eq("community_id", communityId).eq("user_id", userId)
  const { data } = await supabase.from("communities").select("member_count").eq("id", communityId).single()
  if (data) await supabase.from("communities").update({ member_count: Math.max(0, (data.member_count ?? 0) - 1) }).eq("id", communityId)
}

export async function getCommunityMembers(communityId: string) {
  const supabase = await getSupabase()
  const { data } = await supabase
    .from("community_members")
    .select("user:users!community_members_user_id_fkey(id, name, username, profile_picture, role), role, joined_at")
    .eq("community_id", communityId)
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
