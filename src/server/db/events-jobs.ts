import "server-only"
import { createClient } from "@/lib/supabase/server"

async function getSupabase() {
  return await createClient()
}

// ─── Events ─────────────────────────────────────────────────────────────────

export async function getEvents(limit = 20, offset = 0, filters?: { event_type?: string }) {
  const supabase = await getSupabase()
  let q = supabase.from("events").select("*, creator:users!events_created_by_fkey(id, name, profile_picture)").order("start_time", { ascending: true })
  if (filters?.event_type) q = q.eq("event_type", filters.event_type)
  const { data, error } = await q.range(offset, offset + limit - 1)
  if (error) return []
  return data ?? []
}

export async function getEventById(eventId: string) {
  const supabase = await getSupabase()
  const { data, error } = await supabase.from("events").select("*, creator:users!events_created_by_fkey(id, name, profile_picture)").eq("id", eventId).single()
  if (error) return null
  return data
}

export async function createEvent(data: any) {
  const supabase = await getSupabase()
  const { data: event, error } = await supabase.from("events").insert(data).select().single()
  if (error) return null
  return event
}

export async function attendEvent(eventId: string, userId: string) {
  const supabase = await getSupabase()
  await supabase.from("event_attendees").insert({ event_id: eventId, user_id: userId })
  const { data } = await supabase.from("events").select("attendee_count").eq("id", eventId).single()
  if (data) await supabase.from("events").update({ attendee_count: (data.attendee_count ?? 0) + 1 }).eq("id", eventId)
}

export async function unattendEvent(eventId: string, userId: string) {
  const supabase = await getSupabase()
  await supabase.from("event_attendees").delete().eq("event_id", eventId).eq("user_id", userId)
  const { data } = await supabase.from("events").select("attendee_count").eq("id", eventId).single()
  if (data) await supabase.from("events").update({ attendee_count: Math.max(0, (data.attendee_count ?? 0) - 1) }).eq("id", eventId)
}

// ─── Jobs ───────────────────────────────────────────────────────────────────

export async function getJobs(limit = 20, offset = 0, filters?: { query?: string; type?: string }) {
  const supabase = await getSupabase()
  let q = supabase.from("jobs").select("*, poster:users!jobs_posted_by_fkey(id, name, profile_picture)").order("created_at", { ascending: false })
  
  if (filters?.type && filters.type !== "All") {
    q = q.eq("employment_type", filters.type)
  }
  
  if (filters?.query) {
    q = q.or(`title.ilike.%${filters.query}%,company.ilike.%${filters.query}%`)
  }
  
  const { data, error } = await q.range(offset, offset + limit - 1)
  if (error) return []
  return data ?? []
}

export async function getJobById(jobId: string) {
  const supabase = await getSupabase()
  const { data, error } = await supabase.from("jobs").select("*, poster:users!jobs_posted_by_fkey(id, name, profile_picture)").eq("id", jobId).single()
  if (error) return null
  return data
}

export async function createJob(data: any) {
  const supabase = await getSupabase()
  const { data: job, error } = await supabase.from("jobs").insert(data).select().single()
  if (error) return null
  return job
}

export async function applyToJob(jobId: string, userId: string, coverLetter?: string) {
  const supabase = await getSupabase()
  const { data, error } = await supabase.from("job_applications").insert({ job_id: jobId, user_id: userId, cover_letter: coverLetter }).select().single()
  if (error) return null
  const { data: job } = await supabase.from("jobs").select("application_count").eq("id", jobId).single()
  if (job) await supabase.from("jobs").update({ application_count: (job.application_count ?? 0) + 1 }).eq("id", jobId)
  return data
}

export async function getMyApplications(userId: string) {
  const supabase = await getSupabase()
  const { data } = await supabase.from("job_applications").select("*, job:jobs(title, company, location)").eq("user_id", userId).order("created_at", { ascending: false })
  return data ?? []
}
