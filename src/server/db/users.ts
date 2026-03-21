import "server-only"
import { runRead, runWrite, randomUUID, toPlain } from "./client"

// ─── Types ────────────────────────────────────────────────────────────────────

export interface DbUser {
  id: string
  authId: string
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
  authId: string
  email: string
  name: string
  profilePicture?: string
}): Promise<DbUser> {
  return runWrite(async (session) => {
    const now = Date.now()
    const result = await session.run(
      `MERGE (u:User {authId: $authId})
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
        authId: data.authId,
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

export async function getUserByAuthId(authId: string): Promise<DbUser | null> {
  return runRead(async (session) => {
    const result = await session.run(
      `MATCH (u:User {authId: $authId}) RETURN u`,
      { authId }
    )
    if (!result.records.length) return null
    return toPlain(result.records[0].get("u").properties) as unknown as DbUser
  })
}

export async function getUserById(id: string): Promise<DbUser | null> {
  return runRead(async (session) => {
    const result = await session.run(
      `MATCH (u:User) WHERE u.id = $id OR u.authId = $id RETURN u`,
      { id }
    )
    if (!result.records.length) return null
    return toPlain(result.records[0].get("u").properties) as unknown as DbUser
  })
}

export async function searchUsers(
  query: string,
  limit = 10,
  viewerAuthId?: string
): Promise<DbUser[]> {
  return runRead(async (session) => {
    const result = await session.run(
      `MATCH (u:User)
       WHERE (toLower(u.name) CONTAINS toLower($query)
           OR toLower(u.username) CONTAINS toLower($query)
           OR toLower(u.email) CONTAINS toLower($query))
         AND (u.authId <> $viewerAuthId OR $viewerAuthId IS NULL)
       RETURN u
       ORDER BY u.followerCount DESC
       LIMIT $limit`,
      { query, limit, viewerAuthId: viewerAuthId ?? null }
    )
    return result.records.map((r) => toPlain(r.get("u").properties) as unknown as DbUser)
  })
}

// ─── Update ───────────────────────────────────────────────────────────────────

export async function updateUser(
  authId: string,
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

    const params: Record<string, unknown> = { authId, now: Date.now() }
    for (const [k, v] of Object.entries(data)) {
      if (v !== undefined) params[k] = typeof v === "object" ? JSON.stringify(v) : v
    }

    const result = await session.run(
      `MATCH (u:User {authId: $authId})
       SET ${sets}, u.updatedAt = $now
       RETURN u`,
      params
    )
    return toPlain(result.records[0].get("u").properties) as unknown as DbUser
  })
}

export async function addSkill(authId: string, skill: string): Promise<string[]> {
  return runWrite(async (session) => {
    const result = await session.run(
      `MATCH (u:User {authId: $authId})
       SET u.skills = CASE
         WHEN $skill IN u.skills THEN u.skills
         ELSE u.skills + $skill
       END
       RETURN u.skills AS skills`,
      { authId, skill }
    )
    return result.records[0].get("skills") as string[]
  })
}

export async function removeSkill(authId: string, skill: string): Promise<string[]> {
  return runWrite(async (session) => {
    const result = await session.run(
      `MATCH (u:User {authId: $authId})
       SET u.skills = [s IN u.skills WHERE s <> $skill]
       RETURN u.skills AS skills`,
      { authId, skill }
    )
    return result.records[0].get("skills") as string[]
  })
}

export async function completeOnboarding(
  authId: string,
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
      `MATCH (u:User {authId: $authId})
       SET u.username = $username,
           u.bio = $bio,
           u.university = $university,
           u.role = $role,
           u.experienceLevel = $experienceLevel,
           u.skills = $skills,
           u.onboardingCompleted = true,
           u.updatedAt = $now
       RETURN u`,
      { authId, ...data, now: Date.now() }
    )
    return toPlain(result.records[0].get("u").properties) as unknown as DbUser
  })
}

export async function updatePrivacySettings(
  authId: string,
  settings: Record<string, unknown>
): Promise<void> {
  return runWrite(async (session) => {
    await session.run(
      `MATCH (u:User {authId: $authId})
       SET u.privacySettings = $settings, u.updatedAt = $now`,
      { authId, settings: JSON.stringify(settings), now: Date.now() }
    )
  })
}

export async function updateNotificationPreferences(
  authId: string,
  prefs: Record<string, boolean>
): Promise<void> {
  return runWrite(async (session) => {
    await session.run(
      `MATCH (u:User {authId: $authId})
       SET u.notificationPreferences = $prefs, u.updatedAt = $now`,
      { authId, prefs: JSON.stringify(prefs), now: Date.now() }
    )
  })
}

export async function updateProfilePicture(
  authId: string,
  profilePicture: string
): Promise<void> {
  return runWrite(async (session) => {
    await session.run(
      `MATCH (u:User {authId: $authId}) SET u.profilePicture = $profilePicture, u.updatedAt = $now`,
      { authId, profilePicture, now: Date.now() }
    )
  })
}

export async function deleteUserAccount(authId: string): Promise<void> {
  return runWrite(async (session) => {
    // Detach delete removes all relationships first
    await session.run(
      `MATCH (u:User {authId: $authId}) DETACH DELETE u`,
      { authId }
    )
  })
}
