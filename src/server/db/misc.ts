import "server-only"
import { createClient } from "@/lib/supabase/server"

async function getSupabase() {
  return await createClient()
}

// ─── Polls ──────────────────────────────────────────────────────────────────

export async function createPoll(data: { question: string; options: string[]; created_by: string }) {
  const supabase = await getSupabase()
  const { data: poll, error } = await supabase.from("polls").insert({ question: data.question, options: data.options.map((o, i) => ({ index: i, text: o, votes: 0 })), created_by: data.created_by }).select().single()
  if (error) return null
  return poll
}

export async function votePoll(pollId: string, userId: string, optionIndex: number) {
  const supabase = await getSupabase()
  await supabase.from("poll_votes").insert({ poll_id: pollId, user_id: userId, option_index: optionIndex })
}

export async function getPollResults(pollId: string) {
  const supabase = await getSupabase()
  const { data: poll } = await supabase.from("polls").select("*").eq("id", pollId).single()
  const { data: votes } = await supabase.from("poll_votes").select("option_index").eq("poll_id", pollId)
  if (!poll) return null
  const counts: Record<number, number> = {}
  for (const v of votes ?? []) counts[v.option_index] = (counts[v.option_index] ?? 0) + 1
  return { ...poll, votes: counts, total_votes: votes?.length ?? 0 }
}

// ─── Reposts ────────────────────────────────────────────────────────────────

export async function repost(originalPostId: string, reposterId: string, content?: string) {
  const supabase = await getSupabase()
  const { data, error } = await supabase.from("reposts").insert({ original_post_id: originalPostId, reposter_id: reposterId, content }).select().single()
  if (error) return null
  const { data: post } = await supabase.from("posts").select("share_count").eq("id", originalPostId).single()
  if (post) await supabase.from("posts").update({ share_count: (post.share_count ?? 0) + 1 }).eq("id", originalPostId)
  return data
}

export async function undoRepost(originalPostId: string, reposterId: string) {
  const supabase = await getSupabase()
  
  // Check if it was actually reposted
  const { data: existing } = await supabase.from("reposts").select("id").eq("original_post_id", originalPostId).eq("reposter_id", reposterId).single()
  if (!existing) return;
  
  await supabase.from("reposts").delete().eq("id", existing.id)
  
  // Decrement share count
  const { data: post } = await supabase.from("posts").select("share_count").eq("id", originalPostId).single()
  if (post) await supabase.from("posts").update({ share_count: Math.max(0, (post.share_count ?? 0) - 1) }).eq("id", originalPostId)
}

export async function isReposted(postId: string, userId: string): Promise<boolean> {
  const supabase = await getSupabase()
  const { data } = await supabase.from("reposts").select("id").eq("original_post_id", postId).eq("reposter_id", userId).single()
  return !!data
}

// ─── Presence ───────────────────────────────────────────────────────────────

export async function updatePresence(userId: string, status: string) {
  const supabase = await getSupabase()
  await supabase.from("presence").upsert({ user_id: userId, status, last_seen: new Date().toISOString() })
}

export async function getUserStatuses(userIds: string[]) {
  const supabase = await getSupabase()
  const { data } = await supabase.from("presence").select("user_id, status, last_seen").in("user_id", userIds)
  return data ?? []
}


// ─── Marketplace ────────────────────────────────────────────────────────────

export async function getListings(limit = 20, offset = 0, filters?: { category?: string }) {
  const supabase = await getSupabase()
  let q = supabase.from("marketplace_listings").select("*, seller:users!marketplace_listings_posted_by_fkey(id, name, profile_picture)").eq("status", "active").order("created_at", { ascending: false })
  if (filters?.category && filters.category !== "all") q = q.eq("category", filters.category)
  const { data, error } = await q.range(offset, offset + limit - 1)
  if (error) return []
  return data ?? []
}

export async function createListing(data: any) {
  const supabase = await getSupabase()
  const { data: listing, error } = await supabase.from("marketplace_listings").insert(data).select().single()
  if (error) return null
  return listing
}

export async function getListingById(listingId: string) {
  const supabase = await getSupabase()
  const { data: listing, error } = await supabase
    .from("marketplace_listings")
    .select("*, seller:users!marketplace_listings_posted_by_fkey(id, name, username, profile_picture, university)")
    .eq("id", listingId)
    .single()
  if (error || !listing) return null
  return listing
}

export async function updateListing(listingId: string, userId: string, data: any) {
  const supabase = await getSupabase()

  // Verify listing exists
  const { data: listing } = await supabase
    .from("marketplace_listings")
    .select("posted_by")
    .eq("id", listingId)
    .single()

  if (!listing) return { error: "Listing not found", status: 404 }

  // Check ownership / admin authorization
  const { data: user } = await supabase.from("users").select("is_admin").eq("id", userId).single()
  const isAdmin = user?.is_admin ?? false
  if (listing.posted_by !== userId && !isAdmin) {
    return { error: "Forbidden: Only listing owner or admin can update listing", status: 403 }
  }

  const { data: updated, error } = await supabase
    .from("marketplace_listings")
    .update({
      ...data,
      updated_at: new Date().toISOString(),
    })
    .eq("id", listingId)
    .select()
    .single()

  if (error) return { error: error.message, status: 500 }
  return { data: updated }
}

export async function deleteListing(listingId: string, userId: string) {
  const supabase = await getSupabase()

  // Verify listing exists
  const { data: listing } = await supabase
    .from("marketplace_listings")
    .select("posted_by")
    .eq("id", listingId)
    .single()

  if (!listing) return { error: "Listing not found", status: 404 }

  // Check ownership / admin authorization
  const { data: user } = await supabase.from("users").select("is_admin").eq("id", userId).single()
  const isAdmin = user?.is_admin ?? false
  if (listing.posted_by !== userId && !isAdmin) {
    return { error: "Forbidden: Only listing owner or admin can delete listing", status: 403 }
  }

  const { error } = await supabase.from("marketplace_listings").delete().eq("id", listingId)
  if (error) return { error: error.message, status: 500 }
  return { success: true }
}

// ─── Calls ──────────────────────────────────────────────────────────────────

export async function initiateCall(callerId: string, recipientId: string, type: string = "video") {
  const supabase = await getSupabase()
  const { data: call, error } = await supabase
    .from("calls")
    .insert({ caller_id: callerId, recipient_id: recipientId, type, status: "ringing" })
    .select("*, caller:users!calls_caller_id_fkey(id, name, username, profile_picture), recipient:users!calls_recipient_id_fkey(id, name, username, profile_picture)")
    .single()
  if (error) return null
  return call
}

export async function updateCallStatus(callId: string, status: string) {
  const supabase = await getSupabase()
  const update: Record<string, unknown> = { status }
  if (status === "ended" || status === "rejected") {
    update.ended_at = new Date().toISOString()
  }
  await supabase.from("calls").update(update).eq("id", callId)
}

export async function getIncomingCall(userId: string) {
  const supabase = await getSupabase()
  const { data } = await supabase
    .from("calls")
    .select("*, caller:users!calls_caller_id_fkey(id, name, username, profile_picture)")
    .eq("recipient_id", userId)
    .eq("status", "ringing")
    .order("created_at", { ascending: false })
    .limit(1)
    .single()
  return data ?? null
}

export async function getActiveCalls(userId: string) {
  const supabase = await getSupabase()
  const { data } = await supabase
    .from("calls")
    .select("*, caller:users!calls_caller_id_fkey(id, name, username, profile_picture), recipient:users!calls_recipient_id_fkey(id, name, username, profile_picture)")
    .or(`caller_id.eq.${userId},recipient_id.eq.${userId}`)
    .in("status", ["ringing", "active"])
    .order("created_at", { ascending: false })
  return data ?? []
}

// ─── Search ─────────────────────────────────────────────────────────────────

export async function universalSearch(query: string) {
  const supabase = await getSupabase()
  // Escape ILIKE special characters to prevent pattern injection
  const escaped = query.replace(/[%_]/g, (m) => `\\${m}`)
  const [users, posts, communities] = await Promise.all([
    supabase.from("users").select("id, name, username, profile_picture").or(`name.ilike.%${escaped}%,username.ilike.%${escaped}%`).limit(5),
    supabase.from("posts").select("id, content, author_id").ilike("content", `%${escaped}%`).limit(5),
    supabase.from("communities").select("id, name, slug, cover_image").or(`name.ilike.%${escaped}%,description.ilike.%${escaped}%`).limit(5),
  ])
  return {
    users: users.data ?? [],
    posts: posts.data ?? [],
    communities: communities.data ?? [],
  }
}

export async function searchUsers(query: string, limit = 20, offset = 0) {
  const supabase = await getSupabase()
  const escaped = query.replace(/[%_]/g, (m) => `\\${m}`)
  const { data, error } = await supabase
    .from("users")
    .select("id, name, username, profile_picture, university, role")
    .or(`name.ilike.%${escaped}%,username.ilike.%${escaped}%`)
    .range(offset, offset + limit - 1)
  if (error) return []
  return data ?? []
}

export async function searchPosts(query: string, limit = 20, offset = 0) {
  const supabase = await getSupabase()
  const escaped = query.replace(/[%_]/g, (m) => `\\${m}`)
  const { data, error } = await supabase
    .from("posts")
    .select("*, author:users!posts_author_id_fkey(id, name, username, profile_picture)")
    .ilike("content", `%${escaped}%`)
    .order("created_at", { ascending: false })
    .range(offset, offset + limit - 1)
  if (error) return []
  return data ?? []
}

export async function searchCommunities(query: string, limit = 20, offset = 0) {
  const supabase = await getSupabase()
  const escaped = query.replace(/[%_]/g, (m) => `\\${m}`)
  const { data, error } = await supabase
    .from("communities")
    .select("id, name, slug, description, cover_image, member_count")
    .or(`name.ilike.%${escaped}%,description.ilike.%${escaped}%`)
    .order("member_count", { ascending: false })
    .range(offset, offset + limit - 1)
  if (error) return []
  return data ?? []
}

// ─── Skill Endorsements ─────────────────────────────────────────────────────

export async function endorseSkill(userId: string, endorserId: string, skill: string) {
  if (!userId || !endorserId || !skill) {
    return { error: "Missing required parameters", status: 400 }
  }

  // Rule: Do not allow self-endorsement
  if (userId === endorserId) {
    return { error: "You cannot endorse your own skills", status: 400 }
  }

  const supabase = await getSupabase()

  // Verify target user exists
  const { data: user, error: userError } = await supabase
    .from("users")
    .select("id, skills")
    .eq("id", userId)
    .single()

  if (userError || !user) {
    return { error: "Target user not found", status: 404 }
  }

  // Verify target user has the skill
  const currentSkills: string[] = Array.isArray(user.skills) ? user.skills : []
  const hasSkill = currentSkills.some((s) => s.toLowerCase() === skill.toLowerCase())
  if (!hasSkill) {
    return { error: `User does not list "${skill}" as a skill`, status: 400 }
  }

  const { data, error } = await supabase
    .from("skill_endorsements")
    .upsert({ user_id: userId, endorser_id: endorserId, skill })
    .select()
    .single()

  if (error) return { error: error.message, status: 500 }

  // Evaluate badges in background
  import("@/server/db/gamification").then(({ evaluateBadges }) => {
    evaluateBadges(userId).catch(() => {})
  })

  return { success: true, endorsement: data }
}

export async function removeEndorsement(userId: string, endorserId: string, skill: string) {
  if (!userId || !endorserId || !skill) {
    return { error: "Missing required parameters", status: 400 }
  }

  const supabase = await getSupabase()
  const { error } = await supabase
    .from("skill_endorsements")
    .delete()
    .eq("user_id", userId)
    .eq("endorser_id", endorserId)
    .eq("skill", skill)

  if (error) return { error: error.message, status: 500 }

  // Evaluate badges in background
  import("@/server/db/gamification").then(({ evaluateBadges }) => {
    evaluateBadges(userId).catch(() => {})
  })

  return { success: true }
}

export async function getEndorsements(userId: string, viewerId?: string) {
  const supabase = await getSupabase()

  // Fetch user skills and all endorsements for this user
  const [userRes, endorsementsRes] = await Promise.all([
    supabase.from("users").select("skills").eq("id", userId).single(),
    supabase
      .from("skill_endorsements")
      .select("*, endorser:users!skill_endorsements_endorser_id_fkey(id, name, username, profile_picture)")
      .eq("user_id", userId),
  ])

  const skills: string[] = Array.isArray(userRes.data?.skills) ? userRes.data.skills : []
  const endorsements = endorsementsRes.data ?? []

  const skillsList = skills.map((skillName) => {
    const matching = endorsements.filter(
      (e: any) => e.skill.toLowerCase() === skillName.toLowerCase()
    )
    const count = matching.length
    const topEndorsers = matching
      .map((e: any) => e.endorser?.name || "A Peer")
      .slice(0, 3)
    const endorsedByViewer = viewerId
      ? matching.some((e: any) => e.endorser_id === viewerId)
      : false

    return {
      name: skillName,
      count,
      topEndorsers,
      endorsedByViewer,
    }
  })

  return { skills: skillsList }
}

// ─── Portfolio ──────────────────────────────────────────────────────────────

export async function getPortfolio(userId: string) {
  const supabase = await getSupabase()
  const [projects, certifications] = await Promise.all([
    supabase.from("portfolio_projects").select("*").eq("user_id", userId).order("created_at", { ascending: false }),
    supabase.from("portfolio_certifications").select("*").eq("user_id", userId).order("date_obtained", { ascending: false }),
  ])
  return {
    projects: projects.data ?? [],
    certifications: certifications.data ?? [],
  }
}

export async function addProject(userId: string, data: { title: string; description?: string; url?: string; image_url?: string }) {
  const supabase = await getSupabase()
  const { data: project, error } = await supabase
    .from("portfolio_projects")
    .insert({ user_id: userId, ...data })
    .select()
    .single()
  if (error) return null
  return project
}

export async function deleteProject(projectId: string, userId: string) {
  const supabase = await getSupabase()
  const { error } = await supabase
    .from("portfolio_projects")
    .delete()
    .eq("id", projectId)
    .eq("user_id", userId)
  return !error
}

export async function addCertification(userId: string, data: { title: string; issuer: string; date_obtained?: string; credential_url?: string }) {
  const supabase = await getSupabase()
  const { data: cert, error } = await supabase
    .from("portfolio_certifications")
    .insert({ user_id: userId, ...data })
    .select()
    .single()
  if (error) return null
  return cert
}

export async function deleteCertification(certId: string, userId: string) {
  const supabase = await getSupabase()
  const { error } = await supabase
    .from("portfolio_certifications")
    .delete()
    .eq("id", certId)
    .eq("user_id", userId)
  return !error
}

// ─── Ads Tracking ───────────────────────────────────────────────────────────

export async function trackAdImpression(adId: string) {
  const supabase = await getSupabase()
  try {
    await supabase.rpc("increment_field", { table_name: "ads", field_name: "impressions", row_id: adId })
  } catch {
    const { data } = await supabase.from("ads").select("impressions").eq("id", adId).single()
    if (data) await supabase.from("ads").update({ impressions: (data.impressions ?? 0) + 1 }).eq("id", adId)
  }
}

export async function trackAdClick(adId: string) {
  const supabase = await getSupabase()
  try {
    await supabase.rpc("increment_field", { table_name: "ads", field_name: "clicks", row_id: adId })
  } catch {
    const { data } = await supabase.from("ads").select("clicks").eq("id", adId).single()
    if (data) await supabase.from("ads").update({ clicks: (data.clicks ?? 0) + 1 }).eq("id", adId)
  }
}
