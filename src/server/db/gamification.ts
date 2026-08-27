import "server-only"
import { createClient } from "@/lib/supabase/server"

async function getSupabase() {
  return await createClient()
}

export type ReputationEventType =
  | "accepted_answer"
  | "question_upvote"
  | "research_vote"
  | "helpful_review"

export type ReputationSourceType =
  | "question_answer"
  | "question"
  | "research_paper"
  | "research_review"

export interface Badge {
  id: string
  name: string
  description: string
  icon: string
  earned_at: string
}

export interface ReputationEvent {
  id: string
  recipient_user_id: string
  actor_user_id?: string | null
  event_type: ReputationEventType
  source_type: ReputationSourceType
  source_id: string
  points: number
  created_at: string
}

export interface LeaderboardEntry {
  rank: number
  userId: string
  name: string
  username?: string
  profilePicture?: string
  university?: string
  role?: string
  points: number
  level: number
  badges: Badge[]
}

// ─── Reputation Engine ────────────────────────────────────────────────────────

/**
 * Awards reputation points to a user based on verified business activity.
 * Strict duplicate reward protection: UNIQUE(recipient_user_id, event_type, source_id).
 */
export async function awardReputation(params: {
  recipientId: string
  actorId?: string | null
  eventType: ReputationEventType
  sourceType: ReputationSourceType
  sourceId: string
  points: number
}) {
  const { recipientId, actorId, eventType, sourceType, sourceId, points } = params
  if (!recipientId || points <= 0) return { skipped: true, reason: "Invalid parameters" }

  // Rule 6: Do not allow users to directly award themselves points
  if (actorId && recipientId === actorId) {
    return { skipped: true, reason: "Self-rewards are not allowed" }
  }

  const supabase = await getSupabase()

  // 1. Check if event already exists (Idempotency)
  const { data: existing } = await supabase
    .from("reputation_events")
    .select("id, points")
    .eq("recipient_user_id", recipientId)
    .eq("event_type", eventType)
    .eq("source_id", sourceId)
    .single()

  if (existing) {
    return { skipped: true, reason: "Reward already awarded for this event", eventId: existing.id }
  }

  // 2. Insert reputation event
  const { data: event, error: insertError } = await supabase
    .from("reputation_events")
    .insert({
      recipient_user_id: recipientId,
      actor_user_id: actorId ?? null,
      event_type: eventType,
      source_type: sourceType,
      source_id: sourceId,
      points,
    })
    .select()
    .single()

  if (insertError) {
    // Unique constraint violation handled safely
    return { skipped: true, reason: insertError.message }
  }

  // 3. Atomically update or insert user_reputation
  const { data: currentRep } = await supabase
    .from("user_reputation")
    .select("points, level, badges")
    .eq("user_id", recipientId)
    .single()

  const currentPoints = currentRep?.points ?? 0
  const newPoints = currentPoints + points
  const newLevel = Math.max(1, Math.floor(newPoints / 100) + 1)

  await supabase
    .from("user_reputation")
    .upsert({
      user_id: recipientId,
      points: newPoints,
      level: newLevel,
      updated_at: new Date().toISOString(),
    })

  // 4. Evaluate badges deterministically
  const updatedBadges = await evaluateBadges(recipientId)

  return {
    success: true,
    pointsAwarded: points,
    totalPoints: newPoints,
    level: newLevel,
    badges: updatedBadges,
    eventId: event.id,
  }
}

/**
 * Revokes reputation points (e.g. when an upvote is toggled off or vote removed).
 */
export async function revokeReputation(params: {
  recipientId: string
  eventType: ReputationEventType
  sourceId: string
}) {
  const { recipientId, eventType, sourceId } = params
  if (!recipientId) return { skipped: true }

  const supabase = await getSupabase()

  // Find the event
  const { data: existing } = await supabase
    .from("reputation_events")
    .select("id, points")
    .eq("recipient_user_id", recipientId)
    .eq("event_type", eventType)
    .eq("source_id", sourceId)
    .single()

  if (!existing) {
    return { skipped: true, reason: "No matching reputation event found to revoke" }
  }

  // Delete event
  await supabase.from("reputation_events").delete().eq("id", existing.id)

  // Decrement user_reputation points (never below 0)
  const { data: currentRep } = await supabase
    .from("user_reputation")
    .select("points, level")
    .eq("user_id", recipientId)
    .single()

  const currentPoints = currentRep?.points ?? 0
  const newPoints = Math.max(0, currentPoints - existing.points)
  const newLevel = Math.max(1, Math.floor(newPoints / 100) + 1)

  await supabase
    .from("user_reputation")
    .update({
      points: newPoints,
      level: newLevel,
      updated_at: new Date().toISOString(),
    })
    .eq("user_id", recipientId)

  return {
    success: true,
    pointsRevoked: existing.points,
    totalPoints: newPoints,
    level: newLevel,
  }
}

// ─── Achievement Badges System ───────────────────────────────────────────────

/**
 * Deterministic badge definitions and thresholds
 */
export const BADGE_DEFINITIONS: Record<string, { id: string; name: string; description: string; icon: string }> = {
  TOP_RESEARCHER: {
    id: "top_researcher",
    name: "Top Researcher",
    description: "Published academic preprints and earned research community recognition",
    icon: "BookOpen",
  },
  HELPFUL_PEER: {
    id: "helpful_peer",
    name: "Helpful Peer",
    description: "Contributed accepted answers and constructive peer reviews",
    icon: "CheckCircle",
  },
  CAMPUS_LEADER: {
    id: "campus_leader",
    name: "Campus Leader",
    description: "Achieved 100+ reputation points or received 5+ skill endorsements",
    icon: "Trophy",
  },
}

/**
 * Evaluates and awards badges to a user idempotently.
 */
export async function evaluateBadges(userId: string): Promise<Badge[]> {
  const supabase = await getSupabase()

  // Fetch user reputation, endorsement count, papers, and reputation events
  const [repRes, endorsementsRes, eventsRes, papersRes] = await Promise.all([
    supabase.from("user_reputation").select("points, badges").eq("user_id", userId).single(),
    supabase.from("skill_endorsements").select("id").eq("user_id", userId),
    supabase.from("reputation_events").select("event_type, points").eq("recipient_user_id", userId),
    supabase.from("research_papers").select("id").eq("uploaded_by", userId),
  ])

  const rep = repRes?.data
  const totalPoints = rep?.points ?? 0
  const existingBadges: Badge[] = Array.isArray(rep?.badges) ? rep.badges : []
  const existingBadgeIds = new Set(existingBadges.map((b) => b.id))

  const endorsementCount = endorsementsRes?.data?.length ?? 0
  const events = eventsRes?.data ?? []
  const paperCount = papersRes?.data?.length ?? 0

  const hasAcceptedAnswer = events.some((e) => e.event_type === "accepted_answer")
  const hasHelpfulReview = events.some((e) => e.event_type === "helpful_review")
  const hasResearchVote = events.some((e) => e.event_type === "research_vote")

  const newBadges: Badge[] = [...existingBadges]
  const nowIso = new Date().toISOString()

  // 1. Top Researcher: >= 1 paper AND (research vote or >= 50 total points)
  if (!existingBadgeIds.has("top_researcher") && paperCount >= 1 && (hasResearchVote || totalPoints >= 50)) {
    newBadges.push({
      ...BADGE_DEFINITIONS.TOP_RESEARCHER,
      earned_at: nowIso,
    })
  }

  // 2. Helpful Peer: accepted answer OR helpful peer review
  if (!existingBadgeIds.has("helpful_peer") && (hasAcceptedAnswer || hasHelpfulReview)) {
    newBadges.push({
      ...BADGE_DEFINITIONS.HELPFUL_PEER,
      earned_at: nowIso,
    })
  }

  // 3. Campus Leader: >= 100 reputation points OR >= 5 skill endorsements
  if (!existingBadgeIds.has("campus_leader") && (totalPoints >= 100 || endorsementCount >= 5)) {
    newBadges.push({
      ...BADGE_DEFINITIONS.CAMPUS_LEADER,
      earned_at: nowIso,
    })
  }

  // If new badges were added, update user_reputation
  if (newBadges.length !== existingBadges.length) {
    await supabase
      .from("user_reputation")
      .upsert({
        user_id: userId,
        badges: newBadges,
        updated_at: nowIso,
      })
  }

  return newBadges
}

// ─── Leaderboard Engine ───────────────────────────────────────────────────────

/**
 * Fetches real leaderboard data across weekly, monthly, and all-time periods
 * with optional university filtering, deterministic tie-breaking, and current-user rank.
 */
export async function getLeaderboard(params: {
  period?: "weekly" | "monthly" | "all-time"
  university?: string
  limit?: number
  offset?: number
  currentUserId?: string
}): Promise<{
  entries: LeaderboardEntry[]
  currentUserRank: number | null
  currentUserPoints: number | null
  period: "weekly" | "monthly" | "all-time"
  university: string | null
  totalCount: number
}> {
  const period = params.period ?? "all-time"
  const university = params.university && params.university !== "all" ? params.university : null
  const limit = Math.min(100, Math.max(1, params.limit ?? 50))
  const offset = Math.max(0, params.offset ?? 0)
  const currentUserId = params.currentUserId

  const supabase = await getSupabase()

  if (period === "weekly" || period === "monthly") {
    // Determine interval cutoff
    const days = period === "weekly" ? 7 : 30
    const cutoff = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString()

    // 1. Fetch reputation events in period
    const { data: periodEvents } = await supabase
      .from("reputation_events")
      .select("recipient_user_id, points")
      .gte("created_at", cutoff)

    // Aggregate points per user
    const pointsMap: Record<string, number> = {}
    for (const ev of periodEvents ?? []) {
      pointsMap[ev.recipient_user_id] = (pointsMap[ev.recipient_user_id] ?? 0) + ev.points
    }

    const userIds = Object.keys(pointsMap)
    if (userIds.length === 0) {
      return {
        entries: [],
        currentUserRank: null,
        currentUserPoints: 0,
        period,
        university,
        totalCount: 0,
      }
    }

    // 2. Fetch user metadata & reputations
    let userQuery = supabase
      .from("users")
      .select("id, name, username, profile_picture, university, role")
      .in("id", userIds)

    if (university) {
      userQuery = userQuery.eq("university", university)
    }

    const { data: usersData } = await userQuery

    // Fetch badges from user_reputation
    const { data: reputations } = await supabase
      .from("user_reputation")
      .select("user_id, level, badges")
      .in("id", userIds)

    const repMap = new Map((reputations ?? []).map((r) => [r.user_id, r]))

    // Assemble ranked list
    const candidateList = (usersData ?? [])
      .map((u) => {
        const pts = pointsMap[u.id] ?? 0
        const rep = repMap.get(u.id)
        return {
          userId: u.id,
          name: u.name || "Anonymous",
          username: u.username,
          profilePicture: u.profile_picture,
          university: u.university,
          role: u.role,
          points: pts,
          level: rep?.level ?? Math.max(1, Math.floor(pts / 100) + 1),
          badges: Array.isArray(rep?.badges) ? rep.badges : [],
        }
      })
      // Deterministic sort: Points DESC, Name ASC
      .sort((a, b) => b.points - a.points || a.name.localeCompare(b.name))

    const totalCount = candidateList.length

    // Assign 1-indexed ranks
    const rankedList: LeaderboardEntry[] = candidateList.map((entry, index) => ({
      ...entry,
      rank: index + 1,
    }))

    // Find current user rank
    let currentUserRank: number | null = null
    let currentUserPoints: number | null = null
    if (currentUserId) {
      const found = rankedList.find((r) => r.userId === currentUserId)
      if (found) {
        currentUserRank = found.rank
        currentUserPoints = found.points
      }
    }

    const paginatedEntries = rankedList.slice(offset, offset + limit)

    return {
      entries: paginatedEntries,
      currentUserRank,
      currentUserPoints,
      period,
      university,
      totalCount,
    }
  } else {
    // ── All-Time Leaderboard ─────────────────────────────────────────────────
    let q = supabase
      .from("user_reputation")
      .select(`
        user_id,
        points,
        level,
        badges,
        user:users!user_reputation_user_id_fkey(id, name, username, profile_picture, university, role)
      `)
      .gt("points", 0)
      .order("points", { ascending: false })

    const { data: allReps, error } = await q

    if (error || !allReps) {
      return {
        entries: [],
        currentUserRank: null,
        currentUserPoints: 0,
        period,
        university,
        totalCount: 0,
      }
    }

    // Filter by university if specified
    const filtered = allReps
      .map((r: any) => {
        const u = r.user || {}
        return {
          userId: r.user_id,
          name: u.name || "Anonymous",
          username: u.username,
          profilePicture: u.profile_picture,
          university: u.university,
          role: u.role,
          points: r.points ?? 0,
          level: r.level ?? 1,
          badges: Array.isArray(r.badges) ? r.badges : [],
        }
      })
      .filter((entry) => {
        if (!university) return true
        return entry.university?.toLowerCase() === university.toLowerCase()
      })
      // Deterministic sort: Points DESC, Name ASC
      .sort((a, b) => b.points - a.points || a.name.localeCompare(b.name))

    const totalCount = filtered.length

    const rankedList: LeaderboardEntry[] = filtered.map((entry, index) => ({
      ...entry,
      rank: index + 1,
    }))

    let currentUserRank: number | null = null
    let currentUserPoints: number | null = null
    if (currentUserId) {
      const found = rankedList.find((r) => r.userId === currentUserId)
      if (found) {
        currentUserRank = found.rank
        currentUserPoints = found.points
      }
    }

    const paginatedEntries = rankedList.slice(offset, offset + limit)

    return {
      entries: paginatedEntries,
      currentUserRank,
      currentUserPoints,
      period,
      university,
      totalCount,
    }
  }
}

/**
 * Retrieves gamification profile stats for a specific user.
 */
export async function getUserReputation(userId: string) {
  const supabase = await getSupabase()

  const [repRes, eventsRes] = await Promise.all([
    supabase.from("user_reputation").select("*").eq("user_id", userId).single(),
    supabase
      .from("reputation_events")
      .select("*")
      .eq("recipient_user_id", userId)
      .order("created_at", { ascending: false })
      .limit(10),
  ])

  const rep = repRes.data
  const points = rep?.points ?? 0
  const level = rep?.level ?? Math.max(1, Math.floor(points / 100) + 1)
  const badges: Badge[] = Array.isArray(rep?.badges) ? rep.badges : []

  // Compute all-time rank
  const { data: higherUsers } = await supabase
    .from("user_reputation")
    .select("user_id")
    .gt("points", points)

  const rank = (higherUsers?.length ?? 0) + 1

  return {
    userId,
    points,
    level,
    badges,
    rank,
    recentEvents: eventsRes.data ?? [],
  }
}
