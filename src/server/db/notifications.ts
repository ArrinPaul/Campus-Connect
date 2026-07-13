import "server-only"
import { createClient, createAdminClient } from "@/lib/supabase/server"

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
  const adminSupabase = createAdminClient()
  const { data: notif } = await adminSupabase.from("notifications").insert(data).select().single()

  // Broadcast the new notification to the user's channel as a fallback
  if (notif) {
    const channel = adminSupabase.channel(`notifications:${data.user_id}`)
    await channel.send({
      type: "broadcast",
      event: "new_notification",
      payload: notif,
    })
    // we don't necessarily need to removeChannel immediately on server side, 
    // but good practice to clean up if we had a persistent connection.
    adminSupabase.removeChannel(channel)
  }
}
