import { v } from "convex/values"
import { query, mutation } from "./_generated/server"
import { checkRateLimit, RATE_LIMITS } from "./_lib"

// ──────────────────────────────────────────────
// Auth helper
// ──────────────────────────────────────────────
async function getAuthUser(ctx: any) {
  const identity = await ctx.auth.getUserIdentity()
  if (!identity) throw new Error("Unauthorized")
  const user = await ctx.db
    .query("users")
    .withIndex("by_clerkId", (q: any) => q.eq("clerkId", identity.subject))
    .unique()
  if (!user) throw new Error("User not found")
  return user
}

// ──────────────────────────────────────────────
// Mutations
// ──────────────────────────────────────────────

/**
 * Post a new job/internship listing
 */
export const postJob = mutation({
  args: {
    title: v.string(),
    company: v.string(),
    description: v.string(),
    type: v.union(v.literal("job"), v.literal("internship")),
    location: v.string(),
    remote: v.boolean(),
    duration: v.optional(v.string()),
    skillsRequired: v.array(v.string()),
    salary: v.optional(v.string()),
    expiresAt: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const user = await getAuthUser(ctx)

    // Rate limit: 5 job posts per hour
    await checkRateLimit(ctx, user._id, "postJob", RATE_LIMITS.postJob)

    if (!args.title.trim()) throw new Error("Job title cannot be empty")
    if (args.title.length > 200) throw new Error("Title must not exceed 200 characters")
    if (!args.company.trim()) throw new Error("Company name cannot be empty")
    if (args.company.length > 200) throw new Error("Company must not exceed 200 characters")
    if (args.description.length > 5000) throw new Error("Description must not exceed 5000 characters")
    if (!args.location.trim()) throw new Error("Location cannot be empty")
    if (args.skillsRequired.length > 20) throw new Error("Maximum 20 skills allowed")
    if (args.expiresAt && args.expiresAt < Date.now()) {
      throw new Error("Expiry date must be in the future")
    }

    return ctx.db.insert("jobs", {
      title: args.title.trim(),
      company: args.company.trim(),
      description: args.description.trim(),
      type: args.type,
      location: args.location.trim(),
      remote: args.remote,
      duration: args.duration?.trim() || undefined,
      skillsRequired: args.skillsRequired.map((s) => s.trim()).filter(Boolean),
      salary: args.salary?.trim() || undefined,
      postedBy: user._id,
      applicantCount: 0,
      expiresAt: args.expiresAt,
      createdAt: Date.now(),
    })
  },
})

/**
 * Update a job listing (poster only)
 */
export const updateJob = mutation({
  args: {
    jobId: v.id("jobs"),
    title: v.optional(v.string()),
    company: v.optional(v.string()),
    description: v.optional(v.string()),
    location: v.optional(v.string()),
    remote: v.optional(v.boolean()),
    duration: v.optional(v.string()),
    skillsRequired: v.optional(v.array(v.string())),
    salary: v.optional(v.string()),
    expiresAt: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const user = await getAuthUser(ctx)
    const job = await ctx.db.get(args.jobId)
    if (!job) throw new Error("Job not found")
    if (job.postedBy !== user._id) throw new Error("Only the poster can edit this job")

    const updates: any = {}
    if (args.title !== undefined) {
      if (!args.title.trim()) throw new Error("Title cannot be empty")
      if (args.title.length > 200) throw new Error("Title must not exceed 200 characters")
      updates.title = args.title.trim()
    }
    if (args.company !== undefined) {
      if (!args.company.trim()) throw new Error("Company cannot be empty")
      updates.company = args.company.trim()
    }
    if (args.description !== undefined) {
      if (args.description.length > 5000) throw new Error("Description must not exceed 5000 characters")
      updates.description = args.description.trim()
    }
    if (args.location !== undefined) updates.location = args.location.trim()
    if (args.remote !== undefined) updates.remote = args.remote
    if (args.duration !== undefined) updates.duration = args.duration.trim() || undefined
    if (args.skillsRequired !== undefined) {
      if (args.skillsRequired.length > 20) throw new Error("Maximum 20 skills")
      updates.skillsRequired = args.skillsRequired.map((s) => s.trim()).filter(Boolean)
    }
    if (args.salary !== undefined) updates.salary = args.salary.trim() || undefined
    if (args.expiresAt !== undefined) updates.expiresAt = args.expiresAt

    await ctx.db.patch(args.jobId, updates)
  },
})

/**
 * Delete a job listing (poster only) — cascades applications
 */
export const deleteJob = mutation({
  args: { jobId: v.id("jobs") },
  handler: async (ctx, args) => {
    const user = await getAuthUser(ctx)
    const job = await ctx.db.get(args.jobId)
    if (!job) throw new Error("Job not found")
    if (job.postedBy !== user._id) throw new Error("Only the poster can delete this job")

    // Delete all applications
    const apps = await ctx.db
      .query("jobApplications")
      .withIndex("by_job", (q: any) => q.eq("jobId", args.jobId))
      .collect()
    for (const app of apps) {
      await ctx.db.delete(app._id)
    }

    await ctx.db.delete(args.jobId)
  },
})

/**
 * Apply to a job
 */
export const applyToJob = mutation({
  args: {
    jobId: v.id("jobs"),
    coverLetter: v.optional(v.string()),
    resumeUrl: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const user = await getAuthUser(ctx)
    const job = await ctx.db.get(args.jobId)
    if (!job) throw new Error("Job not found")

    // Check for expired
    if (job.expiresAt && job.expiresAt < Date.now()) {
      throw new Error("This job listing has expired")
    }

    // Check for duplicate application
    const existing = await ctx.db
      .query("jobApplications")
      .withIndex("by_user_job", (q: any) => q.eq("userId", user._id).eq("jobId", args.jobId))
      .unique()
    if (existing) throw new Error("You have already applied to this job")

    if (args.coverLetter && args.coverLetter.length > 3000) {
      throw new Error("Cover letter must not exceed 3000 characters")
    }

    const appId = await ctx.db.insert("jobApplications", {
      jobId: args.jobId,
      userId: user._id,
      coverLetter: args.coverLetter?.trim() || undefined,
      resumeUrl: args.resumeUrl || undefined,
      status: "applied",
      createdAt: Date.now(),
    })

    // Increment applicant count
    await ctx.db.patch(args.jobId, { applicantCount: job.applicantCount + 1 })

    return appId
  },
})

/**
 * Update application status (job poster only)
 */
export const updateApplicationStatus = mutation({
  args: {
    applicationId: v.id("jobApplications"),
    status: v.union(
      v.literal("viewed"),
      v.literal("shortlisted"),
      v.literal("rejected")
    ),
  },
  handler: async (ctx, args) => {
    const user = await getAuthUser(ctx)
    const app = await ctx.db.get(args.applicationId)
    if (!app) throw new Error("Application not found")

    const job = await ctx.db.get(app.jobId)
    if (!job) throw new Error("Job not found")
    if (job.postedBy !== user._id) throw new Error("Only the poster can update applications")

    await ctx.db.patch(args.applicationId, { status: args.status })
  },
})

// ──────────────────────────────────────────────
// Queries
// ──────────────────────────────────────────────

/**
 * Get a single job by ID with poster info
 */
export const getJob = query({
  args: { jobId: v.id("jobs") },
  handler: async (ctx, args) => {
    const job = await ctx.db.get(args.jobId)
    if (!job) return null

    const poster = await ctx.db.get(job.postedBy)
    const isExpired = job.expiresAt ? job.expiresAt < Date.now() : false

    // Check if current viewer has applied
    let viewerApplication = null
    const identity = await ctx.auth.getUserIdentity()
    if (identity) {
      const viewer = await ctx.db
        .query("users")
        .withIndex("by_clerkId", (q: any) => q.eq("clerkId", identity.subject))
        .unique()
      if (viewer) {
        viewerApplication = await ctx.db
          .query("jobApplications")
          .withIndex("by_user_job", (q: any) => q.eq("userId", viewer._id).eq("jobId", args.jobId))
          .unique()
      }
    }

    return {
      ...job,
      isExpired,
      poster: poster
        ? { _id: poster._id, name: poster.name, profilePicture: poster.profilePicture }
        : null,
      viewerApplication: viewerApplication
        ? { _id: viewerApplication._id, status: viewerApplication.status }
        : null,
    }
  },
})

/**
 * Search / browse jobs with filters
 */
export const searchJobs = query({
  args: {
    query: v.optional(v.string()),
    type: v.optional(v.union(v.literal("job"), v.literal("internship"))),
    remote: v.optional(v.boolean()),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const limit = Math.min(args.limit ?? 20, 100)
    const allJobs = await ctx.db.query("jobs").order("desc").collect()

    const now = Date.now()
    let filtered = allJobs.filter((j) => !j.expiresAt || j.expiresAt > now) // exclude expired

    const q = args.query?.toLowerCase().trim()
    if (q) {
      filtered = filtered.filter(
        (j) =>
          j.title.toLowerCase().includes(q) ||
          j.company.toLowerCase().includes(q) ||
          j.description.toLowerCase().includes(q) ||
          j.skillsRequired.some((s: string) => s.toLowerCase().includes(q)) ||
          j.location.toLowerCase().includes(q)
      )
    }
    if (args.type) {
      filtered = filtered.filter((j) => j.type === args.type)
    }
    if (args.remote !== undefined) {
      filtered = filtered.filter((j) => j.remote === args.remote)
    }

    const results = filtered.slice(0, limit)

    return Promise.all(
      results.map(async (job) => {
        const poster = await ctx.db.get(job.postedBy)
        return {
          ...job,
          poster: poster
            ? { _id: poster._id, name: poster.name, profilePicture: poster.profilePicture }
            : null,
        }
      })
    )
  },
})

/**
 * Get applications for a specific job (poster only)
 */
export const getJobApplications = query({
  args: { jobId: v.id("jobs") },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity()
    if (!identity) throw new Error("Unauthorized")
    const user = await ctx.db
      .query("users")
      .withIndex("by_clerkId", (q: any) => q.eq("clerkId", identity.subject))
      .unique()
    if (!user) throw new Error("User not found")

    const job = await ctx.db.get(args.jobId)
    if (!job) throw new Error("Job not found")
    if (job.postedBy !== user._id) throw new Error("Not your job listing")

    const apps = await ctx.db
      .query("jobApplications")
      .withIndex("by_job", (q: any) => q.eq("jobId", args.jobId))
      .collect()

    return Promise.all(
      apps.map(async (app: any) => {
        const applicant = await ctx.db.get(app.userId) as any
        return {
          ...app,
          applicant: applicant
            ? {
                _id: applicant._id,
                name: applicant.name,
                profilePicture: applicant.profilePicture,
                university: applicant.university,
                skills: applicant.skills,
              }
            : null,
        }
      })
    )
  },
})

/**
 * Get current user's applications
 */
export const getUserApplications = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity()
    if (!identity) return []
    const user = await ctx.db
      .query("users")
      .withIndex("by_clerkId", (q: any) => q.eq("clerkId", identity.subject))
      .unique()
    if (!user) return []

    const apps = await ctx.db
      .query("jobApplications")
      .withIndex("by_user", (q: any) => q.eq("userId", user._id))
      .collect()

    return Promise.all(
      apps.map(async (app: any) => {
        const job = await ctx.db.get(app.jobId) as any
        return {
          ...app,
          job: job
            ? { _id: job._id, title: job.title, company: job.company, location: job.location }
            : null,
        }
      })
    )
  },
})
