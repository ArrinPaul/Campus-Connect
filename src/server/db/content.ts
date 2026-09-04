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
  // Insert view record (ignore duplicate via unique constraint)
  await supabase.from("story_views").insert({ story_id: storyId, user_id: userId }).select().single()
  // Use atomic increment to avoid race condition
  await supabase.rpc("increment_field", {
    table_name: "stories",
    field_name: "view_count",
    row_id: storyId,
    increment_by: 1,
  })
}

export async function getUserStories(userId: string) {
  const supabase = await getSupabase()
  const { data, error } = await supabase
    .from("stories")
    .select("*, author:users!stories_author_id_fkey(id, name, profile_picture)")
    .eq("author_id", userId)
    .gt("expires_at", new Date().toISOString())
    .order("created_at", { ascending: false })
  if (error) return []
  return data ?? []
}

export async function deleteStory(storyId: string, userId: string) {
  const supabase = await getSupabase()
  const { data: story } = await supabase.from("stories").select("author_id").eq("id", storyId).single()
  if (!story) return { error: "Story not found", status: 404 }
  if (story.author_id !== userId) {
    return { error: "Forbidden: Only the story author can delete this story", status: 403 }
  }

  const { error } = await supabase.from("stories").delete().eq("id", storyId)
  if (error) return { error: error.message, status: 500 }
  return { success: true }
}

// ─── Resources ──────────────────────────────────────────────────────────────

export async function getResources(limit = 20, offset = 0, filters?: { course?: string; search?: string }) {
  const supabase = await getSupabase()
  let q = supabase.from("resources").select("*, uploader:users!resources_uploaded_by_fkey(id, name, profile_picture)").order("created_at", { ascending: false })
  if (filters?.course) q = q.ilike("course", `%${filters.course.replace(/[%_]/g, (m) => `\\${m}`)}%`)
  if (filters?.search) {
    const escaped = filters.search.replace(/[%_]/g, (m) => `\\${m}`)
    q = q.or(`title.ilike.%${escaped}%,description.ilike.%${escaped}%`)
  }
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

export async function getResourceById(resourceId: string) {
  const supabase = await getSupabase()
  const { data: resource, error } = await supabase
    .from("resources")
    .select("*, uploader:users!resources_uploaded_by_fkey(id, name, username, profile_picture)")
    .eq("id", resourceId)
    .single()
  if (error || !resource) return null
  return resource
}

export async function updateResource(resourceId: string, userId: string, updates: Partial<{ title: string; description: string; course: string }>) {
  const supabase = await getSupabase()
  const { data: resource } = await supabase.from("resources").select("uploaded_by").eq("id", resourceId).single()
  if (!resource) return { error: "Resource not found", status: 404 }

  const { data: user } = await supabase.from("users").select("is_admin").eq("id", userId).single()
  const isAdmin = user?.is_admin ?? false
  if (resource.uploaded_by !== userId && !isAdmin) {
    return { error: "Forbidden: Only the uploader or admin can update this resource", status: 403 }
  }

  const { data: updated, error } = await supabase
    .from("resources")
    .update(updates)
    .eq("id", resourceId)
    .select()
    .single()

  if (error) return { error: error.message, status: 500 }
  return { data: updated }
}

export async function deleteResource(resourceId: string, userId: string) {
  const supabase = await getSupabase()
  const { data: resource } = await supabase.from("resources").select("uploaded_by").eq("id", resourceId).single()
  if (!resource) return { error: "Resource not found", status: 404 }

  const { data: user } = await supabase.from("users").select("is_admin").eq("id", userId).single()
  const isAdmin = user?.is_admin ?? false
  if (resource.uploaded_by !== userId && !isAdmin) {
    return { error: "Forbidden: Only the uploader or admin can delete this resource", status: 403 }
  }

  const { error } = await supabase.from("resources").delete().eq("id", resourceId)
  if (error) return { error: error.message, status: 500 }
  return { success: true }
}

export async function getResourceDownloadUrl(resourceId: string) {
  const supabase = await getSupabase()
  const { data: resource, error } = await supabase.from("resources").select("file_url, download_count").eq("id", resourceId).single()
  if (error || !resource) return { error: "Resource not found", status: 404 }

  await supabase.rpc("increment_field", {
    table_name: "resources",
    field_name: "download_count",
    row_id: resourceId,
    increment_by: 1,
  })

  return { data: { url: resource.file_url, downloadCount: (resource.download_count ?? 0) + 1 } }
}

// ─── Research Papers ────────────────────────────────────────────────────────

export async function getPapers(limit = 20, offset = 0, query?: string) {
  const supabase = await getSupabase()
  let q = supabase.from("research_papers").select("*, uploader:users!research_papers_uploaded_by_fkey(id, name, profile_picture)").order("created_at", { ascending: false })
  if (query) {
    const escaped = query.replace(/[%_]/g, (m) => `\\${m}`)
    q = q.or(`title.ilike.%${escaped}%,abstract.ilike.%${escaped}%`)
  }
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
  if (filters?.search) {
    const escaped = filters.search.replace(/[%_]/g, (m) => `\\${m}`)
    q = q.or(`title.ilike.%${escaped}%,content.ilike.%${escaped}%`)
  }
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
  // Use atomic increment to avoid race condition
  await supabase.rpc("increment_field", {
    table_name: "questions",
    field_name: "answer_count",
    row_id: questionId,
    increment_by: 1,
  })
  return answer
}

export async function acceptAnswer(answerId: string) {
  const supabase = await getSupabase()
  
  // First get the answer to find the question ID and author ID
  const { data: answer, error: ansError } = await supabase
    .from("question_answers")
    .select("question_id, author_id")
    .eq("id", answerId)
    .single()
    
  if (ansError || !answer) return false

  // Mark answer as accepted
  const { error: updError } = await supabase
    .from("question_answers")
    .update({ is_accepted: true })
    .eq("id", answerId)
    
  if (updError) return false

  // Mark question as resolved
  await supabase
    .from("questions")
    .update({ is_resolved: true })
    .eq("id", answer.question_id)

  // Award +15 reputation points to the answer author (Gamification Engine)
  if (answer.author_id) {
    const { awardReputation } = await import("@/server/db/gamification")
    await awardReputation({
      recipientId: answer.author_id,
      actorId: null,
      eventType: "accepted_answer",
      sourceType: "question_answer",
      sourceId: answerId,
      points: 15,
    })
  }
    
  return true
}

export async function voteQuestion(questionId: string, userId: string, voteType: "up" | "down" = "up") {
  const supabase = await getSupabase()

  // Fetch question author
  const { data: question } = await supabase.from("questions").select("author_id").eq("id", questionId).single()
  const authorId = question?.author_id

  const { data: existing } = await supabase
    .from("reactions")
    .select("id, type")
    .eq("user_id", userId)
    .eq("target_id", questionId)
    .eq("target_type", "question")
    .single()

  let userVote: "up" | "down" | null = voteType
  let diff = voteType === "up" ? 1 : -1

  const { awardReputation, revokeReputation } = await import("@/server/db/gamification")

  if (existing) {
    if (existing.type === voteType) {
      // Toggle off
      await supabase.from("reactions").delete().eq("id", existing.id)
      diff = voteType === "up" ? -1 : 1
      userVote = null

      if (voteType === "up" && authorId) {
        await revokeReputation({
          recipientId: authorId,
          eventType: "question_upvote",
          sourceId: questionId,
        })
      }
    } else {
      // Switch vote from opposite
      await supabase.from("reactions").update({ type: voteType }).eq("id", existing.id)
      diff = voteType === "up" ? 2 : -2
      userVote = voteType

      if (voteType === "up" && authorId) {
        await awardReputation({
          recipientId: authorId,
          actorId: userId,
          eventType: "question_upvote",
          sourceType: "question",
          sourceId: questionId,
          points: 5,
        })
      } else if (voteType === "down" && authorId) {
        await revokeReputation({
          recipientId: authorId,
          eventType: "question_upvote",
          sourceId: questionId,
        })
      }
    }
  } else {
    // New vote
    await supabase.from("reactions").insert({
      user_id: userId,
      target_id: questionId,
      target_type: "question",
      type: voteType,
    })

    if (voteType === "up" && authorId) {
      await awardReputation({
        recipientId: authorId,
        actorId: userId,
        eventType: "question_upvote",
        sourceType: "question",
        sourceId: questionId,
        points: 5,
      })
    }
  }

  // Atomically update question vote_count
  await supabase.rpc("increment_field", {
    table_name: "questions",
    field_name: "vote_count",
    row_id: questionId,
    increment_by: diff,
  })

  const { data: updatedQuestion } = await supabase
    .from("questions")
    .select("vote_count")
    .eq("id", questionId)
    .single()

  return {
    voteCount: updatedQuestion?.vote_count ?? 0,
    userVote,
  }
}

export async function updateQuestion(questionId: string, userId: string, updates: Partial<{ title: string; content: string; tags: string[] }>) {
  const supabase = await getSupabase()
  const { data: question } = await supabase.from("questions").select("author_id").eq("id", questionId).single()
  if (!question) return { error: "Question not found", status: 404 }

  const { data: user } = await supabase.from("users").select("is_admin").eq("id", userId).single()
  const isAdmin = user?.is_admin ?? false
  if (question.author_id !== userId && !isAdmin) {
    return { error: "Forbidden: Only the question author or admin can update this question", status: 403 }
  }

  const { data: updated, error } = await supabase
    .from("questions")
    .update(updates)
    .eq("id", questionId)
    .select()
    .single()

  if (error) return { error: error.message, status: 500 }
  return { data: updated }
}

export async function deleteQuestion(questionId: string, userId: string) {
  const supabase = await getSupabase()
  const { data: question } = await supabase.from("questions").select("author_id").eq("id", questionId).single()
  if (!question) return { error: "Question not found", status: 404 }

  const { data: user } = await supabase.from("users").select("is_admin").eq("id", userId).single()
  const isAdmin = user?.is_admin ?? false
  if (question.author_id !== userId && !isAdmin) {
    return { error: "Forbidden: Only the question author or admin can delete this question", status: 403 }
  }

  const { error } = await supabase.from("questions").delete().eq("id", questionId)
  if (error) return { error: error.message, status: 500 }
  return { success: true }
}

export async function getQuestionAnswers(questionId: string) {
  const supabase = await getSupabase()
  const { data, error } = await supabase
    .from("question_answers")
    .select("*, author:users!question_answers_author_id_fkey(id, name, username, profile_picture)")
    .eq("question_id", questionId)
    .order("is_accepted", { ascending: false })
    .order("created_at", { ascending: true })
  if (error) return []
  return data ?? []
}

// ─── Research Paper Extended Features ───────────────────────────────────────

export async function getPaperById(paperId: string) {
  const supabase = await getSupabase()
  const { data: paper, error } = await supabase
    .from("research_papers")
    .select("*, uploader:users!research_papers_uploaded_by_fkey(id, name, username, profile_picture, university, role)")
    .eq("id", paperId)
    .single()
  if (error || !paper) return null
  return paper
}

export async function updatePaper(paperId: string, userId: string, updates: Partial<{ title: string; abstract: string; tags: string[]; file_url: string; authors: string[] }>) {
  const supabase = await getSupabase()
  const { data: paper } = await supabase.from("research_papers").select("uploaded_by").eq("id", paperId).single()
  if (!paper) return { error: "Paper not found", status: 404 }

  const { data: user } = await supabase.from("users").select("is_admin").eq("id", userId).single()
  const isAdmin = user?.is_admin ?? false
  if (paper.uploaded_by !== userId && !isAdmin) {
    return { error: "Forbidden: Only paper uploader or admin can update paper", status: 403 }
  }

  const { data: updated, error } = await supabase
    .from("research_papers")
    .update(updates)
    .eq("id", paperId)
    .select()
    .single()

  if (error) return { error: error.message, status: 500 }
  return { data: updated }
}

export async function deletePaper(paperId: string, userId: string) {
  const supabase = await getSupabase()
  const { data: paper } = await supabase.from("research_papers").select("uploaded_by").eq("id", paperId).single()
  if (!paper) return { error: "Paper not found", status: 404 }

  const { data: user } = await supabase.from("users").select("is_admin").eq("id", userId).single()
  const isAdmin = user?.is_admin ?? false
  if (paper.uploaded_by !== userId && !isAdmin) {
    return { error: "Forbidden: Only paper uploader or admin can delete paper", status: 403 }
  }

  const { error } = await supabase.from("research_papers").delete().eq("id", paperId)
  if (error) return { error: error.message, status: 500 }
  return { success: true }
}

export async function votePaper(paperId: string, userId: string, voteType: "up" | "down" = "up") {
  const supabase = await getSupabase()

  // Verify paper exists
  const { data: paper } = await supabase.from("research_papers").select("id, uploaded_by").eq("id", paperId).single()
  if (!paper) return { error: "Paper not found", status: 404 }
  const uploaderId = paper.uploaded_by

  const { data: existing } = await supabase
    .from("reactions")
    .select("id, type")
    .eq("user_id", userId)
    .eq("target_id", paperId)
    .eq("target_type", "research")
    .single()

  let userVote: "up" | "down" | null = voteType
  let diff = voteType === "up" ? 1 : -1

  const { awardReputation, revokeReputation } = await import("@/server/db/gamification")

  if (existing) {
    if (existing.type === voteType) {
      // Toggle off
      await supabase.from("reactions").delete().eq("id", existing.id)
      diff = voteType === "up" ? -1 : 1
      userVote = null

      if (voteType === "up" && uploaderId) {
        await revokeReputation({
          recipientId: uploaderId,
          eventType: "research_vote",
          sourceId: paperId,
        })
      }
    } else {
      // Switch vote from opposite
      await supabase.from("reactions").update({ type: voteType }).eq("id", existing.id)
      diff = voteType === "up" ? 2 : -2
      userVote = voteType

      if (voteType === "up" && uploaderId) {
        await awardReputation({
          recipientId: uploaderId,
          actorId: userId,
          eventType: "research_vote",
          sourceType: "research_paper",
          sourceId: paperId,
          points: 10,
        })
      } else if (voteType === "down" && uploaderId) {
        await revokeReputation({
          recipientId: uploaderId,
          eventType: "research_vote",
          sourceId: paperId,
        })
      }
    }
  } else {
    // New vote
    await supabase.from("reactions").insert({
      user_id: userId,
      target_id: paperId,
      target_type: "research",
      type: voteType,
    })

    if (voteType === "up" && uploaderId) {
      await awardReputation({
        recipientId: uploaderId,
        actorId: userId,
        eventType: "research_vote",
        sourceType: "research_paper",
        sourceId: paperId,
        points: 10,
      })
    }
  }

  // Atomically update paper vote_count
  await supabase.rpc("increment_field", {
    table_name: "research_papers",
    field_name: "vote_count",
    row_id: paperId,
    increment_by: diff,
  })

  const { data: updatedPaper } = await supabase
    .from("research_papers")
    .select("vote_count")
    .eq("id", paperId)
    .single()

  return {
    voteCount: updatedPaper?.vote_count ?? 0,
    userVote,
  }
}

export async function submitPaperReview(paperId: string, reviewerId: string, review: {
  rating: number
  comments: string
  recommendation?: "accept" | "minor_revision" | "major_revision" | "reject"
}) {
  const supabase = await getSupabase()

  // Verify paper exists
  const { data: paper } = await supabase
    .from("research_papers")
    .select("id, uploaded_by")
    .eq("id", paperId)
    .single()

  if (!paper) return { error: "Paper not found", status: 404 }

  // Authors cannot review their own paper
  if (paper.uploaded_by === reviewerId) {
    return { error: "Authors cannot submit peer reviews on their own papers", status: 403 }
  }

  // Increment review_count on research_papers
  await supabase.rpc("increment_field", {
    table_name: "research_papers",
    field_name: "review_count",
    row_id: paperId,
    increment_by: 1,
  })

  // Award +10 reputation points for submitting a helpful peer review
  const { awardReputation } = await import("@/server/db/gamification")
  await awardReputation({
    recipientId: reviewerId,
    actorId: reviewerId, // Note: reviewer is doing the helpful work
    eventType: "helpful_review",
    sourceType: "research_review",
    sourceId: paperId,
    points: 10,
  })

  return {
    success: true,
    paperId,
    reviewerId,
    rating: review.rating,
    comments: review.comments,
    recommendation: review.recommendation || "accept",
    createdAt: new Date().toISOString(),
  }
}


