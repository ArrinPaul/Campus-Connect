import "server-only"
import { createClient } from "@/lib/supabase/server"

export interface DbUser {
  id: string
  email: string
  name: string
  username?: string
  bio?: string
  university?: string
  role?: string
  experience_level?: string
  profile_picture?: string
  skills?: string[]
  social_links?: Record<string, string>
  follower_count?: number
  following_count?: number
  post_count?: number
  onboarding_completed?: boolean
  is_admin?: boolean
  created_at?: string
  updated_at?: string
}

async function getSupabase() {
  return await createClient()
}

// ─── Read ───────────────────────────────────────────────────────────────────

export async function getUserById(id: string): Promise<DbUser | null> {
  const supabase = await getSupabase()
  const { data, error } = await supabase
    .from("users")
    .select("*")
    .eq("id", id)
    .single()
  if (error) return null
  return data as DbUser
}

export async function getUserByUsername(username: string): Promise<DbUser | null> {
  const supabase = await getSupabase()
  const { data, error } = await supabase
    .from("users")
    .select("*")
    .eq("username", username)
    .single()
  if (error) return null
  return data as DbUser
}

export async function searchUsers(
  query: string,
  limit = 10,
  viewerId?: string
): Promise<DbUser[]> {
  const supabase = await getSupabase()
  let q = supabase
    .from("users")
    .select("*")
    .or(`name.ilike.%${query}%,username.ilike.%${query}%,email.ilike.%${query}%`)
    .order("follower_count", { ascending: false })
    .limit(limit)
  if (viewerId) {
    q = q.neq("id", viewerId)
  }
  const { data, error } = await q
  if (error) return []
  return (data ?? []) as DbUser[]
}

// ─── Update ─────────────────────────────────────────────────────────────────

export async function updateUser(
  id: string,
  data: Partial<{
    name: string
    username: string
    bio: string
    university: string
    role: string
    experience_level: string
    profile_picture: string
    social_links: Record<string, string>
  }>
): Promise<DbUser | null> {
  const supabase = await getSupabase()
  const { data: updated, error } = await supabase
    .from("users")
    .update(data)
    .eq("id", id)
    .select()
    .single()
  if (error) return null
  return updated as DbUser
}

export async function addSkill(userId: string, skill: string): Promise<string[]> {
  const supabase = await getSupabase()
  const { data: user } = await supabase
    .from("users")
    .select("skills")
    .eq("id", userId)
    .single()
  if (!user) return []
  const currentSkills = user.skills ?? []
  if (currentSkills.includes(skill)) return currentSkills
  const newSkills = [...currentSkills, skill]
  await supabase
    .from("users")
    .update({ skills: newSkills })
    .eq("id", userId)
  return newSkills
}

export async function removeSkill(userId: string, skill: string): Promise<string[]> {
  const supabase = await getSupabase()
  const { data: user } = await supabase
    .from("users")
    .select("skills")
    .eq("id", userId)
    .single()
  if (!user) return []
  const newSkills = (user.skills ?? []).filter((s: string) => s !== skill)
  await supabase
    .from("users")
    .update({ skills: newSkills })
    .eq("id", userId)
  return newSkills
}

export async function completeOnboarding(
  userId: string,
  data: {
    username: string
    bio: string
    university: string
    role: string
    experience_level?: string
    skills: string[]
  }
): Promise<DbUser | null> {
  const supabase = await getSupabase()
  const { data: updated, error } = await supabase
    .from("users")
    .update({
      username: data.username,
      bio: data.bio,
      university: data.university,
      role: data.role,
      experience_level: data.experience_level ?? "Beginner",
      skills: data.skills,
      onboarding_completed: true,
    })
    .eq("id", userId)
    .select()
    .single()
  if (error) return null
  return updated as DbUser
}

export async function updateProfilePicture(
  userId: string,
  profilePicture: string
): Promise<void> {
  const supabase = await getSupabase()
  await supabase
    .from("users")
    .update({ profile_picture: profilePicture })
    .eq("id", userId)
}

export async function updatePrivacySettings(
  userId: string,
  settings: Record<string, unknown>
): Promise<void> {
  const supabase = await getSupabase()
  await supabase
    .from("users")
    .update({ social_links: settings })
    .eq("id", userId)
}

export async function updateNotificationPreferences(
  userId: string,
  prefs: Record<string, boolean>
): Promise<void> {
  const supabase = await getSupabase()
  await supabase
    .from("users")
    .update({ social_links: prefs })
    .eq("id", userId)
}

export async function deleteUserAccount(userId: string): Promise<void> {
  const supabase = await getSupabase()
  await supabase.from("users").delete().eq("id", userId)
}
