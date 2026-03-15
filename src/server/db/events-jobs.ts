import "server-only"
import { runRead, runWrite, randomUUID, toPlain } from "./client"

// ─── Events ───────────────────────────────────────────────────────────────────

export interface DbEvent {
  id: string
  title: string
  description?: string
  location?: string
  isVirtual: boolean
  meetingUrl?: string
  startDate: number
  endDate?: number
  organizerId: string
  communityId?: string
  attendeeCount: number
  category?: string
  tags?: string[]
  imageUrl?: string
  createdAt: number
  organizer?: Record<string, unknown>
  isAttending?: boolean
}

export async function createEvent(
  clerkId: string,
  data: Omit<DbEvent, "id" | "organizerId" | "attendeeCount" | "createdAt" | "organizer" | "isAttending">
): Promise<DbEvent> {
  return runWrite(async (session) => {
    const id = randomUUID()
    const now = Date.now()
    const result = await session.run(
      `MATCH (u:User {clerkId: $clerkId})
       CREATE (e:Event {
         id: $id, title: $title, description: $description,
         location: $location, isVirtual: $isVirtual, meetingUrl: $meetingUrl,
         startDate: $startDate, endDate: $endDate,
         organizerId: u.id, communityId: $communityId,
         attendeeCount: 0, category: $category, tags: $tags,
         imageUrl: $imageUrl, createdAt: $now
       })
       CREATE (u)-[:ORGANIZED]->(e)
       RETURN e, u`,
      { clerkId, id, ...data, description: data.description ?? "", location: data.location ?? null,
        meetingUrl: data.meetingUrl ?? null, endDate: data.endDate ?? null,
        communityId: data.communityId ?? null, category: data.category ?? "",
        tags: data.tags ?? [], imageUrl: data.imageUrl ?? null, now }
    )
    return {
      ...toPlain(result.records[0].get("e").properties),
      organizer: toPlain(result.records[0].get("u").properties),
    } as unknown as DbEvent
  })
}

export async function getEvents(
  filter?: string,
  limit = 20,
  cursor?: string
): Promise<DbEvent[]> {
  return runRead(async (session) => {
    const now = Date.now()
    const cursorTs = cursor ? parseInt(cursor, 10) : now
    const whereClause = filter === "upcoming"
      ? "WHERE e.startDate >= $now AND e.startDate > $cursorTs"
      : "WHERE e.startDate > $cursorTs"
    const result = await session.run(
      `MATCH (e:Event)<-[:ORGANIZED]-(u:User) ${whereClause}
       RETURN e, u ORDER BY e.startDate ASC LIMIT $limit`,
      { now, cursorTs, limit }
    )
    return result.records.map((r) => ({
      ...toPlain(r.get("e").properties),
      organizer: toPlain(r.get("u").properties),
    })) as unknown as DbEvent[]
  })
}

export async function getEventById(id: string, clerkId?: string): Promise<DbEvent | null> {
  return runRead(async (session) => {
    const result = await session.run(
      `MATCH (e:Event {id: $id})<-[:ORGANIZED]-(u:User)
       OPTIONAL MATCH (me:User {clerkId: $clerkId})-[:ATTENDING]->(e)
       RETURN e, u, me IS NOT NULL AS isAttending`,
      { id, clerkId: clerkId ?? null }
    )
    if (!result.records.length) return null
    return {
      ...toPlain(result.records[0].get("e").properties),
      organizer: toPlain(result.records[0].get("u").properties),
      isAttending: result.records[0].get("isAttending") as boolean,
    } as unknown as DbEvent
  })
}

export async function attendEvent(clerkId: string, eventId: string): Promise<void> {
  return runWrite(async (session) => {
    await session.run(
      `MATCH (u:User {clerkId: $clerkId}), (e:Event {id: $eventId})
       MERGE (u)-[:ATTENDING]->(e)
       ON CREATE SET e.attendeeCount = coalesce(e.attendeeCount, 0) + 1`,
      { clerkId, eventId }
    )
  })
}

export async function unattendEvent(clerkId: string, eventId: string): Promise<void> {
  return runWrite(async (session) => {
    await session.run(
      `MATCH (u:User {clerkId: $clerkId})-[a:ATTENDING]->(e:Event {id: $eventId})
       DELETE a
       SET e.attendeeCount = CASE WHEN e.attendeeCount > 0 THEN e.attendeeCount - 1 ELSE 0 END`,
      { clerkId, eventId }
    )
  })
}

// ─── Jobs ─────────────────────────────────────────────────────────────────────

export interface DbJob {
  id: string
  title: string
  company: string
  description: string
  location?: string
  isRemote: boolean
  type: string
  salary?: string
  requirements?: string[]
  tags?: string[]
  deadline?: number
  postedById: string
  createdAt: number
  poster?: Record<string, unknown>
  isApplied?: boolean
}

export async function createJob(
  clerkId: string,
  data: Omit<DbJob, "id" | "postedById" | "createdAt" | "poster" | "isApplied">
): Promise<DbJob> {
  return runWrite(async (session) => {
    const id = randomUUID()
    const now = Date.now()
    const result = await session.run(
      `MATCH (u:User {clerkId: $clerkId})
       CREATE (j:Job {
         id: $id, title: $title, company: $company,
         description: $description, location: $location,
         isRemote: $isRemote, type: $type, salary: $salary,
         requirements: $requirements, tags: $tags,
         deadline: $deadline, postedById: u.id, createdAt: $now
       })
       CREATE (u)-[:POSTED_JOB]->(j)
       RETURN j, u`,
      { clerkId, id, ...data,
        location: data.location ?? null, salary: data.salary ?? null,
        requirements: data.requirements ?? [], tags: data.tags ?? [],
        deadline: data.deadline ?? null, now }
    )
    return {
      ...toPlain(result.records[0].get("j").properties),
      poster: toPlain(result.records[0].get("u").properties),
    } as unknown as DbJob
  })
}

export async function getJobs(
  filter?: Partial<{ search: string; type: string; isRemote: boolean }>,
  limit = 20,
  cursor?: string
): Promise<DbJob[]> {
  return runRead(async (session) => {
    const cursorTs = cursor ? parseInt(cursor, 10) : Date.now() + 1
    const whereClause = filter?.search
      ? `WHERE j.createdAt < $cursorTs AND (toLower(j.title) CONTAINS toLower($search) OR toLower(j.company) CONTAINS toLower($search))`
      : "WHERE j.createdAt < $cursorTs"
    const result = await session.run(
      `MATCH (j:Job)<-[:POSTED_JOB]-(u:User) ${whereClause}
       RETURN j, u ORDER BY j.createdAt DESC LIMIT $limit`,
      { cursorTs, search: filter?.search ?? "", limit }
    )
    return result.records.map((r) => ({
      ...toPlain(r.get("j").properties),
      poster: toPlain(r.get("u").properties),
    })) as unknown as DbJob[]
  })
}

export async function getJobById(id: string): Promise<DbJob | null> {
  return runRead(async (session) => {
    const result = await session.run(
      `MATCH (j:Job {id: $id})<-[:POSTED_JOB]-(u:User) RETURN j, u`,
      { id }
    )
    if (!result.records.length) return null
    return {
      ...toPlain(result.records[0].get("j").properties),
      poster: toPlain(result.records[0].get("u").properties),
    } as unknown as DbJob
  })
}

export async function applyToJob(
  clerkId: string,
  jobId: string,
  coverLetter?: string
): Promise<void> {
  return runWrite(async (session) => {
    await session.run(
      `MATCH (u:User {clerkId: $clerkId}), (j:Job {id: $jobId})
       MERGE (u)-[a:APPLIED_TO]->(j)
       ON CREATE SET a.coverLetter = $coverLetter, a.appliedAt = $now, a.status = 'pending'`,
      { clerkId, jobId, coverLetter: coverLetter ?? "", now: Date.now() }
    )
  })
}

export async function getMyApplications(clerkId: string): Promise<{ job: DbJob; status: string; appliedAt: number }[]> {
  return runRead(async (session) => {
    const result = await session.run(
      `MATCH (u:User {clerkId: $clerkId})-[a:APPLIED_TO]->(j:Job)<-[:POSTED_JOB]-(poster:User)
       RETURN j, poster, a.status AS status, a.appliedAt AS appliedAt
       ORDER BY a.appliedAt DESC`,
      { clerkId }
    )
    return result.records.map((r) => ({
      job: { ...toPlain(r.get("j").properties), poster: toPlain(r.get("poster").properties) } as unknown as DbJob,
      status: r.get("status") as string,
      appliedAt: r.get("appliedAt") as number,
    }))
  })
}
