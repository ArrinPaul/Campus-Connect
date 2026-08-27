import "server-only"
import { createAdminClient } from "@/lib/supabase/server"
import { getEmbeddingProvider } from "./embedding-provider"
import { createLogger } from "@/lib/logger"

const log = createLogger("MatchingEngine")

export interface MatchScoreResult {
  score: number // 0 to 100
  reasons: string[]
  factors: {
    skillOverlap: number
    universityMatch: boolean
    interestSimilarity: number
    reputationTier: number
  }
}

export interface PartnerRecommendation {
  user: {
    id: string
    name: string
    username: string
    profile_picture?: string | null
    university?: string | null
    department?: string | null
    skills?: string[] | null
    bio?: string | null
  }
  score: number
  reasons: string[]
}

// ─── Mathematical Similarity Functions ────────────────────────────────────────

export function computeCosineSimilarity(a: number[], b: number[]): number {
  if (!a || !b || a.length === 0 || b.length === 0) return 0
  const len = Math.min(a.length, b.length)

  let dotProduct = 0
  let magA = 0
  let magB = 0

  for (let i = 0; i < len; i++) {
    dotProduct += a[i] * b[i]
    magA += a[i] * a[i]
    magB += b[i] * b[i]
  }

  magA = Math.sqrt(magA)
  magB = Math.sqrt(magB)

  if (magA === 0 || magB === 0) return 0
  const similarity = dotProduct / (magA * magB)
  return Math.max(0, Math.min(1, similarity))
}

export function computeJaccardSimilarity(setA: string[], setB: string[]): number {
  if (!setA || !setB || (setA.length === 0 && setB.length === 0)) return 0
  const lowerA = new Set(setA.map((s) => s.toLowerCase()))
  const lowerB = new Set(setB.map((s) => s.toLowerCase()))

  let intersectionCount = 0
  lowerA.forEach((item) => {
    if (lowerB.has(item)) intersectionCount++
  })

  const unionSize = lowerA.size + lowerB.size - intersectionCount
  if (unionSize === 0) return 0
  return intersectionCount / unionSize
}

// ─── Multi-Factor Match Score Algorithm ──────────────────────────────────────

export function calculateUserMatchScore(userA: any, userB: any): MatchScoreResult {
  const reasons: string[] = []

  // 1. Skill Overlap (35% weight)
  const skillsA: string[] = Array.isArray(userA.skills) ? userA.skills : []
  const skillsB: string[] = Array.isArray(userB.skills) ? userB.skills : []
  const skillOverlap = computeJaccardSimilarity(skillsA, skillsB)
  if (skillOverlap > 0) {
    const commonSkills = skillsA.filter((s) => skillsB.some((sb) => sb.toLowerCase() === s.toLowerCase()))
    reasons.push(`Shared skills: ${commonSkills.slice(0, 3).join(", ")}`)
  }

  // 2. University / Academic Institution Overlap (25% weight)
  const universityMatch =
    !!userA.university &&
    !!userB.university &&
    userA.university.toLowerCase() === userB.university.toLowerCase()

  if (universityMatch) {
    reasons.push(`Both at ${userA.university}`)
  }

  // 3. Department / Field Overlap (20% weight)
  const departmentMatch =
    !!userA.department &&
    !!userB.department &&
    userA.department.toLowerCase() === userB.department.toLowerCase()

  if (departmentMatch) {
    reasons.push(`Same field: ${userA.department}`)
  }

  // 4. Bio / Interests textual similarity (20% weight)
  const bioA = userA.bio || ""
  const bioB = userB.bio || ""
  const wordsA = bioA.toLowerCase().split(/\W+/).filter((w: string) => w.length > 3)
  const wordsB = bioB.toLowerCase().split(/\W+/).filter((w: string) => w.length > 3)
  const interestSimilarity = computeJaccardSimilarity(wordsA, wordsB)

  // Compute weighted composite score (0 to 100)
  let rawScore =
    skillOverlap * 35 +
    (universityMatch ? 25 : 0) +
    (departmentMatch ? 20 : 0) +
    interestSimilarity * 20

  // Baseline academic discovery floor
  if (rawScore === 0) {
    rawScore = 15
    reasons.push("Recommended for campus networking")
  }

  const finalScore = Math.min(100, Math.round(rawScore))

  return {
    score: finalScore,
    reasons,
    factors: {
      skillOverlap,
      universityMatch,
      interestSimilarity,
      reputationTier: 1,
    },
  }
}

// ─── Study Buddy & Project Partner Discovery ─────────────────────────────────

export async function getRecommendedPartners(params: {
  userId: string
  university?: string
  limit?: number
  offset?: number
}): Promise<PartnerRecommendation[]> {
  const { userId, university, limit = 10, offset = 0 } = params
  const supabase = createAdminClient()

  // 1. Fetch current user profile
  const { data: currentUser } = await supabase
    .from("users")
    .select("id, name, username, profile_picture, university, department, skills, bio")
    .eq("id", userId)
    .single()

  if (!currentUser) return []

  // 2. Query candidates (exclude self)
  let query = supabase
    .from("users")
    .select("id, name, username, profile_picture, university, department, skills, bio")
    .neq("id", userId)

  if (university) {
    query = query.eq("university", university)
  }

  const { data: candidates, error } = await query.range(0, 50)
  if (error || !candidates) {
    log.error("Failed to query partner candidates", { error: error?.message })
    return []
  }

  // 3. Compute score for each candidate and rank
  const scoredList: PartnerRecommendation[] = candidates.map((cand) => {
    const match = calculateUserMatchScore(currentUser, cand)
    return {
      user: cand,
      score: match.score,
      reasons: match.reasons,
    }
  })

  // Sort descending by score
  scoredList.sort((a, b) => b.score - a.score)

  return scoredList.slice(offset, offset + limit)
}

// ─── Semantic Research Search ────────────────────────────────────────────────

export async function searchResearchSemantic(params: {
  query: string
  limit?: number
  offset?: number
}) {
  const { query, limit = 10, offset = 0 } = params
  const supabase = createAdminClient()

  if (!query || query.trim().length === 0) {
    const { data } = await supabase
      .from("research_papers")
      .select("*, author:users!research_papers_author_id_fkey(id, name, username, profile_picture)")
      .order("created_at", { ascending: false })
      .range(offset, offset + limit - 1)
    return data ?? []
  }

  const provider = getEmbeddingProvider()
  const queryVector = await provider.generateEmbedding(query)

  // Fetch embeddings from database
  const { data: embeddings } = await supabase
    .from("research_embeddings")
    .select("paper_id, embedding")

  if (embeddings && embeddings.length > 0) {
    const scored = embeddings.map((e) => ({
      paper_id: e.paper_id,
      similarity: computeCosineSimilarity(queryVector, e.embedding),
    }))

    scored.sort((a, b) => b.similarity - a.similarity)
    const topPaperIds = scored.slice(offset, offset + limit).map((s) => s.paper_id)

    if (topPaperIds.length > 0) {
      const { data: papers } = await supabase
        .from("research_papers")
        .select("*, author:users!research_papers_author_id_fkey(id, name, username, profile_picture)")
        .in("id", topPaperIds)

      if (papers && papers.length > 0) {
        return papers
      }
    }
  }

  // Keyword fallback
  const { data: fallbackPapers } = await supabase
    .from("research_papers")
    .select("*, author:users!research_papers_author_id_fkey(id, name, username, profile_picture)")
    .or(`title.ilike.%${query}%,abstract.ilike.%${query}%`)
    .order("created_at", { ascending: false })
    .range(offset, offset + limit - 1)

  return fallbackPapers ?? []
}
