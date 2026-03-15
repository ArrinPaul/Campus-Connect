import "server-only"
import { runRead, runWrite, randomUUID, toPlain } from "./client"

// ─── Types ────────────────────────────────────────────────────────────────────

export interface DbUser {
  id: string
  clerkId: string
  email: string
  name: string
  username?: string
  profilePicture?: string
  bio?: string
  university?: string
  role?: string
  experienceLevel?: string
  skills?: string[]
  socialLinks?: Record<string, string>
  followerCount?: number
  followingCount?: number
  onboardingCompleted?: boolean
  notificationPreferences?: Record<string, boolean>
  privacySettings?: Record<string, unknown>
  isVerified?: boolean
  createdAt?: number
  updatedAt?: number
}

// ─── Create / Upsert ─────────────────────────────────────────────────────────

export async function upsertUser(data: {
  clerkId: string
  email: string
  name: string
  profilePicture?: string
}): Promise<DbUser> {
  return runWrite(async (session) => {
    const now = Date.now()
    const result = await session.run(
      `MERGE (u:User {clerkId: $clerkId})
       ON CREATE SET
         u.id = $id,
         u.email = $email,
         u.name = $name,
         u.profilePicture = $profilePicture,
         u.bio = '',
         u.university = '',
         u.role = 'Student',
         u.experienceLevel = 'Beginner',
         u.skills = [],
         u.socialLinks = '{}',
         u.followerCount = 0,
         u.followingCount = 0,
         u.onboardingCompleted = false,
         u.createdAt = $now,
         u.updatedAt = $now
       ON MATCH SET
         u.email = $email,
         u.name = $name,
         u.profilePicture = CASE WHEN $profilePicture IS NOT NULL THEN $profilePicture ELSE u.profilePicture END,
         u.updatedAt = $now
       RETURN u`,
      {
        clerkId: data.clerkId,
        id: randomUUID(),
        email: data.email,
        name: data.name,
        profilePicture: data.profilePicture ?? null,
        now,
      }
    )
    return toPlain(result.records[0].get("u").properties) as unknown as DbUser
  })
}

// ─── Read ─────────────────────────────────────────────────────────────────────

export async function getUserByClerkId(clerkId: string): Promise<DbUser | null> {
  return runRead(async (session) => {
    const result = await session.run(
      `MATCH (u:User {clerkId: $clerkId}) RETURN u`,
      { clerkId }
    )
    if (!result.records.length) return null
    return toPlain(result.records[0].get("u").properties) as unknown as DbUser
  })
}

export async function getUserById(id: string): Promise<DbUser | null> {
  return runRead(async (session) => {
    const result = await session.run(
      `MATCH (u:User) WHERE u.id = $id OR u.clerkId = $id RETURN u`,
      { id }
    )
    if (!result.records.length) return null
    return toPlain(result.records[0].get("u").properties) as unknown as DbUser
  })
}

export async function searchUsers(
  query: string,
  limit = 10,
  viewerClerkId?: string
): Promise<DbUser[]> {
  return runRead(async (session) => {
    const result = await session.run(
      `MATCH (u:User)
       WHERE (toLower(u.name) CONTAINS toLower($query)
           OR toLower(u.username) CONTAINS toLower($query)
           OR toLower(u.email) CONTAINS toLower($query))
         AND (u.clerkId <> $viewerClerkId OR $viewerClerkId IS NULL)
       RETURN u
       ORDER BY u.followerCount DESC
       LIMIT $limit`,
      { query, limit, viewerClerkId: viewerClerkId ?? null }
    )
    return result.records.map((r) => toPlain(r.get("u").properties) as unknown as DbUser)
  })
}

// ─── Update ───────────────────────────────────────────────────────────────────

export async function updateUser(
  clerkId: string,
  data: Partial<{
    name: string
    username: string
    bio: string
    university: string
    role: string
    experienceLevel: string
    profilePicture: string
    socialLinks: Record<string, string>
  }>
): Promise<DbUser> {
  return runWrite(async (session) => {
    const sets = Object.entries(data)
      .filter(([, v]) => v !== undefined)
      .map(([k]) => `u.${k} = $${k}`)
      .join(", ")

    const params: Record<string, unknown> = { clerkId, now: Date.now() }
    for (const [k, v] of Object.entries(data)) {
      if (v !== undefined) params[k] = typeof v === "object" ? JSON.stringify(v) : v
    }

    const result = await session.run(
      `MATCH (u:User {clerkId: $clerkId})
       SET ${sets}, u.updatedAt = $now
       RETURN u`,
      params
    )
    return toPlain(result.records[0].get("u").properties) as unknown as DbUser
  })
}

export async function addSkill(clerkId: string, skill: string): Promise<string[]> {
  return runWrite(async (session) => {
    const result = await session.run(
      `MATCH (u:User {clerkId: $clerkId})
       SET u.skills = CASE
         WHEN $skill IN u.skills THEN u.skills
         ELSE u.skills + $skill
       END
       RETURN u.skills AS skills`,
      { clerkId, skill }
    )
    return result.records[0].get("skills") as string[]
  })
}

export async function removeSkill(clerkId: string, skill: string): Promise<string[]> {
  return runWrite(async (session) => {
    const result = await session.run(
      `MATCH (u:User {clerkId: $clerkId})
       SET u.skills = [s IN u.skills WHERE s <> $skill]
       RETURN u.skills AS skills`,
      { clerkId, skill }
    )
    return result.records[0].get("skills") as string[]
  })
}

export async function completeOnboarding(
  clerkId: string,
  data: {
    username: string
    bio: string
    university: string
    role: string
    experienceLevel: string
    skills: string[]
  }
): Promise<DbUser> {
  return runWrite(async (session) => {
    const result = await session.run(
      `MATCH (u:User {clerkId: $clerkId})
       SET u.username = $username,
           u.bio = $bio,
           u.university = $university,
           u.role = $role,
           u.experienceLevel = $experienceLevel,
           u.skills = $skills,
           u.onboardingCompleted = true,
           u.updatedAt = $now
       RETURN u`,
      { clerkId, ...data, now: Date.now() }
    )
    return toPlain(result.records[0].get("u").properties) as unknown as DbUser
  })
}

export async function updatePrivacySettings(
  clerkId: string,
  settings: Record<string, unknown>
): Promise<void> {
  return runWrite(async (session) => {
    await session.run(
      `MATCH (u:User {clerkId: $clerkId})
       SET u.privacySettings = $settings, u.updatedAt = $now`,
      { clerkId, settings: JSON.stringify(settings), now: Date.now() }
    )
  })
}

export async function updateNotificationPreferences(
  clerkId: string,
  prefs: Record<string, boolean>
): Promise<void> {
  return runWrite(async (session) => {
    await session.run(
      `MATCH (u:User {clerkId: $clerkId})
       SET u.notificationPreferences = $prefs, u.updatedAt = $now`,
      { clerkId, prefs: JSON.stringify(prefs), now: Date.now() }
    )
  })
}

export async function updateProfilePicture(
  clerkId: string,
  profilePicture: string
): Promise<void> {
  return runWrite(async (session) => {
    await session.run(
      `MATCH (u:User {clerkId: $clerkId}) SET u.profilePicture = $profilePicture, u.updatedAt = $now`,
      { clerkId, profilePicture, now: Date.now() }
    )
  })
}

export async function deleteUserAccount(clerkId: string): Promise<void> {
  return runWrite(async (session) => {
    // Detach delete removes all relationships first
    await session.run(
      `MATCH (u:User {clerkId: $clerkId}) DETACH DELETE u`,
      { clerkId }
    )
  })
}
