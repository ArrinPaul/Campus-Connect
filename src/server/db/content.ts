import "server-only"
import { runRead, runWrite, randomUUID, toPlain } from "./client"

// ─── Stories ──────────────────────────────────────────────────────────────────

export interface DbStory {
  id: string
  authorId: string
  mediaUrl: string
  mediaType: "image" | "video" | "text"
  textContent?: string
  backgroundColor?: string
  expiresAt: number
  viewCount: number
  createdAt: number
  author?: Record<string, unknown>
  hasViewed?: boolean
}

export async function createStory(
  clerkId: string,
  data: { mediaUrl: string; mediaType: "image" | "video" | "text"; textContent?: string; backgroundColor?: string }
): Promise<DbStory> {
  return runWrite(async (session) => {
    const id = randomUUID()
    const now = Date.now()
    const expiresAt = now + 24 * 60 * 60 * 1000
    const result = await session.run(
      `MATCH (u:User {clerkId: $clerkId})
       CREATE (s:Story {
         id: $id, authorId: u.id, mediaUrl: $mediaUrl, mediaType: $mediaType,
         textContent: $textContent, backgroundColor: $backgroundColor,
         expiresAt: $expiresAt, viewCount: 0, createdAt: $now
       })
       CREATE (u)-[:CREATED_STORY]->(s)
       RETURN s, u`,
      { clerkId, id, ...data, textContent: data.textContent ?? null, backgroundColor: data.backgroundColor ?? null, expiresAt, now }
    )
    return { ...toPlain(result.records[0].get("s").properties), author: toPlain(result.records[0].get("u").properties) } as unknown as DbStory
  })
}

export async function getActiveStories(clerkId: string): Promise<{ user: Record<string, unknown>; stories: DbStory[] }[]> {
  return runRead(async (session) => {
    const now = Date.now()
    const result = await session.run(
      `MATCH (me:User {clerkId: $clerkId})-[:FOLLOWS]->(u:User)-[:CREATED_STORY]->(s:Story)
       WHERE s.expiresAt > $now
       OPTIONAL MATCH (me)-[:VIEWED_STORY]->(s)
       WITH u, s, count(me) > 0 AS hasViewed
       ORDER BY u.id, s.createdAt
       RETURN u, collect({story: s, hasViewed: hasViewed}) AS stories`,
      { clerkId, now }
    )
    return result.records.map((r) => ({
      user: toPlain(r.get("u").properties),
      stories: (r.get("stories") as Array<{ story: { properties: Record<string, unknown> }; hasViewed: boolean }>).map((item) => ({
        ...toPlain(item.story.properties),
        hasViewed: item.hasViewed,
      })) as unknown as DbStory[],
    }))
  })
}

export async function viewStory(clerkId: string, storyId: string): Promise<void> {
  return runWrite(async (session) => {
    await session.run(
      `MATCH (u:User {clerkId: $clerkId}), (s:Story {id: $storyId})
       MERGE (u)-[:VIEWED_STORY]->(s)
       ON CREATE SET s.viewCount = coalesce(s.viewCount, 0) + 1`,
      { clerkId, storyId }
    )
  })
}

// ─── Questions (Q&A) ──────────────────────────────────────────────────────────

export interface DbQuestion {
  id: string
  title: string
  body: string
  tags?: string[]
  authorId: string
  answerCount: number
  voteCount: number
  viewCount: number
  acceptedAnswerId?: string
  createdAt: number
  author?: Record<string, unknown>
}

export interface DbAnswer {
  id: string
  questionId: string
  body: string
  authorId: string
  voteCount: number
  isAccepted: boolean
  createdAt: number
  author?: Record<string, unknown>
}

export async function createQuestion(
  clerkId: string,
  data: { title: string; body: string; tags?: string[] }
): Promise<DbQuestion> {
  return runWrite(async (session) => {
    const id = randomUUID()
    const now = Date.now()
    const result = await session.run(
      `MATCH (u:User {clerkId: $clerkId})
       CREATE (q:Question {
         id: $id, title: $title, body: $body, tags: $tags,
         authorId: u.id, answerCount: 0, voteCount: 0, viewCount: 0,
         createdAt: $now
       })
       CREATE (u)-[:ASKED]->(q)
       RETURN q, u`,
      { clerkId, id, ...data, tags: data.tags ?? [], now }
    )
    return { ...toPlain(result.records[0].get("q").properties), author: toPlain(result.records[0].get("u").properties) } as unknown as DbQuestion
  })
}

export async function getQuestions(limit = 20, cursor?: string): Promise<DbQuestion[]> {
  return runRead(async (session) => {
    const cursorTs = cursor ? parseInt(cursor, 10) : Date.now() + 1
    const result = await session.run(
      `MATCH (q:Question)<-[:ASKED]-(u:User) WHERE q.createdAt < $cursorTs
       RETURN q, u ORDER BY q.createdAt DESC LIMIT $limit`,
      { cursorTs, limit }
    )
    return result.records.map((r) => ({ ...toPlain(r.get("q").properties), author: toPlain(r.get("u").properties) }) as unknown as DbQuestion)
  })
}

export async function getQuestionById(id: string): Promise<DbQuestion | null> {
  return runRead(async (session) => {
    const result = await session.run(
      `MATCH (q:Question {id: $id})<-[:ASKED]-(u:User)
       SET q.viewCount = coalesce(q.viewCount, 0) + 1
       RETURN q, u`,
      { id }
    )
    if (!result.records.length) return null
    return { ...toPlain(result.records[0].get("q").properties), author: toPlain(result.records[0].get("u").properties) } as unknown as DbQuestion
  })
}

export async function answerQuestion(clerkId: string, questionId: string, body: string): Promise<DbAnswer> {
  return runWrite(async (session) => {
    const id = randomUUID()
    const now = Date.now()
    const result = await session.run(
      `MATCH (u:User {clerkId: $clerkId}), (q:Question {id: $questionId})
       CREATE (a:Answer { id: $id, questionId: $questionId, body: $body, authorId: u.id, voteCount: 0, isAccepted: false, createdAt: $now })
       CREATE (u)-[:ANSWERED]->(a)
       CREATE (a)-[:ANSWERS]->(q)
       SET q.answerCount = coalesce(q.answerCount, 0) + 1
       RETURN a, u`,
      { clerkId, questionId, id, body, now }
    )
    return { ...toPlain(result.records[0].get("a").properties), author: toPlain(result.records[0].get("u").properties) } as unknown as DbAnswer
  })
}

export async function getAnswers(questionId: string): Promise<DbAnswer[]> {
  return runRead(async (session) => {
    const result = await session.run(
      `MATCH (a:Answer)-[:ANSWERS]->(q:Question {id: $questionId})<-[:ANSWERED]-(u:User)
       OPTIONAL MATCH (u2:User)-[:ANSWERED]->(a)
       RETURN a, coalesce(u2, u) AS author ORDER BY a.isAccepted DESC, a.voteCount DESC`,
      { questionId }
    )
    return result.records.map((r) => ({ ...toPlain(r.get("a").properties), author: toPlain(r.get("author").properties) }) as unknown as DbAnswer)
  })
}

// ─── Resources ────────────────────────────────────────────────────────────────

export interface DbResource {
  id: string
  title: string
  description?: string
  fileUrl: string
  fileType: string
  fileSize?: number
  category?: string
  tags?: string[]
  downloadCount: number
  uploaderId: string
  createdAt: number
  uploader?: Record<string, unknown>
}

export async function uploadResource(
  clerkId: string,
  data: { title: string; description?: string; fileUrl: string; fileType: string; fileSize?: number; category?: string; tags?: string[] }
): Promise<DbResource> {
  return runWrite(async (session) => {
    const id = randomUUID()
    const now = Date.now()
    const result = await session.run(
      `MATCH (u:User {clerkId: $clerkId})
       CREATE (r:Resource {
         id: $id, title: $title, description: $description,
         fileUrl: $fileUrl, fileType: $fileType, fileSize: $fileSize,
         category: $category, tags: $tags, downloadCount: 0,
         uploaderId: u.id, createdAt: $now
       })
       CREATE (u)-[:UPLOADED]->(r)
       RETURN r, u`,
      { clerkId, id, ...data, description: data.description ?? "", category: data.category ?? "", tags: data.tags ?? [], fileSize: data.fileSize ?? 0, now }
    )
    return { ...toPlain(result.records[0].get("r").properties), uploader: toPlain(result.records[0].get("u").properties) } as unknown as DbResource
  })
}

export async function getResources(filter?: { category?: string; search?: string }, limit = 20): Promise<DbResource[]> {
  return runRead(async (session) => {
    const whereClause = filter?.search
      ? "WHERE toLower(r.title) CONTAINS toLower($search) OR toLower(r.description) CONTAINS toLower($search)"
      : ""
    const result = await session.run(
      `MATCH (r:Resource)<-[:UPLOADED]-(u:User) ${whereClause}
       RETURN r, u ORDER BY r.createdAt DESC LIMIT $limit`,
      { search: filter?.search ?? "", limit }
    )
    return result.records.map((r) => ({ ...toPlain(r.get("r").properties), uploader: toPlain(r.get("u").properties) }) as unknown as DbResource)
  })
}

// ─── Research Papers ──────────────────────────────────────────────────────────

export interface DbPaper {
  id: string
  title: string
  abstract?: string
  authors?: string[]
  fileUrl: string
  tags?: string[]
  field?: string
  voteCount: number
  uploaderId: string
  createdAt: number
  uploader?: Record<string, unknown>
}

export async function uploadPaper(
  clerkId: string,
  data: { title: string; abstract?: string; authors?: string[]; fileUrl: string; tags?: string[]; field?: string }
): Promise<DbPaper> {
  return runWrite(async (session) => {
    const id = randomUUID()
    const now = Date.now()
    const result = await session.run(
      `MATCH (u:User {clerkId: $clerkId})
       CREATE (p:ResearchPaper {
         id: $id, title: $title, abstract: $abstract, authors: $authors,
         fileUrl: $fileUrl, tags: $tags, field: $field, voteCount: 0,
         uploaderId: u.id, createdAt: $now
       })
       CREATE (u)-[:UPLOADED]->(p)
       RETURN p, u`,
      { clerkId, id, ...data, abstract: data.abstract ?? "", authors: data.authors ?? [], tags: data.tags ?? [], field: data.field ?? "", now }
    )
    return { ...toPlain(result.records[0].get("p").properties), uploader: toPlain(result.records[0].get("u").properties) } as unknown as DbPaper
  })
}

export async function getPapers(filter?: { search?: string; field?: string }, limit = 20): Promise<DbPaper[]> {
  return runRead(async (session) => {
    const whereClause = filter?.search
      ? "WHERE toLower(p.title) CONTAINS toLower($search) OR toLower(p.abstract) CONTAINS toLower($search)"
      : ""
    const result = await session.run(
      `MATCH (p:ResearchPaper)<-[:UPLOADED]-(u:User) ${whereClause}
       RETURN p, u ORDER BY p.createdAt DESC LIMIT $limit`,
      { search: filter?.search ?? "", limit }
    )
    return result.records.map((r) => ({ ...toPlain(r.get("p").properties), uploader: toPlain(r.get("u").properties) }) as unknown as DbPaper)
  })
}
