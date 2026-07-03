import "server-only"
import { createClient } from "@/lib/supabase/server"

async function getSupabase() {
  return await createClient()
}

export async function getNotifications(userId: string, limit = 30, offset = 0) {
  const supabase = await getSupabase()
  const { data, error } = await supabase
    .from("notifications")
    .select("*, from_user:users!notifications_from_user_id_fkey(id, name, profile_picture)")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .range(offset, offset + limit - 1)
  if (error) return []
  return data ?? []
}

export async function markAsRead(notificationId: string) {
  const supabase = await getSupabase()
  await supabase.from("notifications").update({ read: true }).eq("id", notificationId)
}

export async function markAllAsRead(userId: string) {
  const supabase = await getSupabase()
  await supabase.from("notifications").update({ read: true }).eq("user_id", userId).eq("read", false)
}

export async function getUnreadCount(userId: string): Promise<number> {
  const supabase = await getSupabase()
  const { count } = await supabase.from("notifications").select("*", { count: "exact", head: true }).eq("user_id", userId).eq("read", false)
  return count ?? 0
}

export async function createNotification(data: {
  user_id: string
  type: string
  message: string
  reference_id?: string
  reference_type?: string
  from_user_id?: string
}) {
  const supabase = await getSupabase()
  await supabase.from("notifications").insert(data)
}
