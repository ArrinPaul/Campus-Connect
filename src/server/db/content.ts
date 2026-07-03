import "server-only"
import { createClient } from "@/lib/supabase/server"

async function getSupabase() {
  return await createClient()
}

// ─── Stories ────────────────────────────────────────────────────────────────

export async function getActiveStories() {
  const supabase = await getSupabase()
  const { data } = await supabase.from("stories").select("*, author:users!stories_author_id_fkey(id, name, profile_picture)").gt("expires_at", new Date().toISOString()).order("created_at", { ascending: false })
  return data ?? []
}

export async function createStory(data: { author_id: string; content?: string; media_url?: string; background_color?: string }) {
  const supabase = await getSupabase()
  const { data: story, error } = await supabase.from("stories").insert(data).select().single()
  if (error) return null
  return story
}

export async function viewStory(storyId: string, userId: string) {
  const supabase = await getSupabase()
  await supabase.from("story_views").insert({ story_id: storyId, user_id: userId }).catch(() => {})
  const { data } = await supabase.from("stories").select("view_count").eq("id", storyId).single()
  if (data) await supabase.from("stories").update({ view_count: (data.view_count ?? 0) + 1 }).eq("id", storyId)
}

// ─── Resources ──────────────────────────────────────────────────────────────

export async function getResources(limit = 20, offset = 0, filters?: { course?: string; search?: string }) {
  const supabase = await getSupabase()
  let q = supabase.from("resources").select("*, uploader:users!resources_uploaded_by_fkey(id, name, profile_picture)").order("created_at", { ascending: false })
  if (filters?.course) q = q.ilike("course", `%${filters.course}%`)
  if (filters?.search) q = q.or(`title.ilike.%${filters.search}%,description.ilike.%${filters.search}%`)
  const { data, error } = await q.range(offset, offset + limit - 1)
  if (error) return []
  return data ?? []
}

export async function uploadResource(data: any) {
  const supabase = await getSupabase()
  const { data: resource, error } = await supabase.from("resources").insert(data).select().single()
  if (error) return null
  return resource
}

// ─── Research Papers ────────────────────────────────────────────────────────

export async function getPapers(limit = 20, offset = 0, query?: string) {
  const supabase = await getSupabase()
  let q = supabase.from("research_papers").select("*, uploader:users!research_papers_uploaded_by_fkey(id, name, profile_picture)").order("created_at", { ascending: false })
  if (query) q = q.or(`title.ilike.%${query}%,abstract.ilike.%${query}%`)
  const { data, error } = await q.range(offset, offset + limit - 1)
  if (error) return []
  return data ?? []
}

export async function uploadPaper(data: any) {
  const supabase = await getSupabase()
  const { data: paper, error } = await supabase.from("research_papers").insert(data).select().single()
  if (error) return null
  return paper
}

// ─── Questions (Q&A) ───────────────────────────────────────────────────────

export async function getQuestions(limit = 20, offset = 0, filters?: { sort?: string; tag?: string; search?: string }) {
  const supabase = await getSupabase()
  let q = supabase.from("questions").select("*, author:users!questions_author_id_fkey(id, name, profile_picture)")
  if (filters?.tag) q = q.contains("tags", [filters.tag])
  if (filters?.search) q = q.or(`title.ilike.%${filters.search}%,content.ilike.%${filters.search}%`)
  if (filters?.sort === "votes") q = q.order("vote_count", { ascending: false })
  else if (filters?.sort === "unanswered") q = q.eq("answer_count", 0).order("created_at", { ascending: false })
  else q = q.order("created_at", { ascending: false })
  const { data, error } = await q.range(offset, offset + limit - 1)
  if (error) return []
  return data ?? []
}

export async function createQuestion(data: any) {
  const supabase = await getSupabase()
  const { data: question, error } = await supabase.from("questions").insert(data).select().single()
  if (error) return null
  return question
}

export async function answerQuestion(questionId: string, authorId: string, content: string) {
  const supabase = await getSupabase()
  const { data: answer, error } = await supabase.from("question_answers").insert({ question_id: questionId, author_id: authorId, content }).select().single()
  if (error) return null
  const { data: q } = await supabase.from("questions").select("answer_count").eq("id", questionId).single()
  if (q) await supabase.from("questions").update({ answer_count: (q.answer_count ?? 0) + 1 }).eq("id", questionId)
  return answer
}
