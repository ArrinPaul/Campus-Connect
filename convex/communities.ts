import { v } from "convex/values"
import { query, mutation } from "./_generated/server"

// ────────────────────────────────────────────
// Communities / Groups (Phase 5.1)
// ────────────────────────────────────────────

const VALID_CATEGORIES = [
  "Academic",
  "Research",
  "Social",
  "Sports",
  "Clubs",
  "Technology",
  "Arts",
  "Other",
]

function slugify(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .substring(0, 50)
}

async function getAuthenticatedUser(ctx: any) {
  const identity = await ctx.auth.getUserIdentity()
  if (!identity) throw new Error("Unauthorized")
  const user = await ctx.db
    .query("users")
    .withIndex("by_clerkId", (q: any) => q.eq("clerkId", identity.subject))
    .unique()
  if (!user) throw new Error("User not found")
  return user
}

async function getMembership(ctx: any, communityId: any, userId: any) {
  return ctx.db
    .query("communityMembers")
    .withIndex("by_community_user", (q: any) =>
      q.eq("communityId", communityId).eq("userId", userId)
    )
    .unique()
}

// ────────────────────────────────────────────
// Mutations
// ────────────────────────────────────────────

/**
 * Create a new community.
 */
export const createCommunity = mutation({
  args: {
    name: v.string(),
    description: v.string(),
    type: v.union(
      v.literal("public"),
      v.literal("private"),
      v.literal("secret")
    ),
    category: v.string(),
    rules: v.optional(v.array(v.string())),
  },
  handler: async (ctx, args) => {
    const currentUser = await getAuthenticatedUser(ctx)

    const name = args.name.trim()
    if (name.length < 3) throw new Error("Community name must be at least 3 characters")
    if (name.length > 100) throw new Error("Community name must be at most 100 characters")
    if (!VALID_CATEGORIES.includes(args.category)) {
      throw new Error(`Invalid category. Must be one of: ${VALID_CATEGORIES.join(", ")}`)
    }

    // Generate unique slug
    const baseSlug = slugify(name)
    let slug = baseSlug
    let attempt = 0
    while (true) {
      const existing = await ctx.db
        .query("communities")
        .withIndex("by_slug", (q: any) => q.eq("slug", slug))
        .unique()
      if (!existing) break
      attempt++
      slug = `${baseSlug}-${attempt}`
    }

    const communityId = await ctx.db.insert("communities", {
      name,
      slug,
      description: args.description.trim(),
      type: args.type,
      category: args.category,
      rules: args.rules ?? [],
      memberCount: 1,
      createdBy: currentUser._id,
      createdAt: Date.now(),
    })

    // Creator is the owner
    await ctx.db.insert("communityMembers", {
      communityId,
      userId: currentUser._id,
      role: "owner",
      joinedAt: Date.now(),
    })

    return { communityId, slug }
  },
})

/**
 * Join a public community.
 */
export const joinCommunity = mutation({
  args: { communityId: v.id("communities") },
  handler: async (ctx, args) => {
    const currentUser = await getAuthenticatedUser(ctx)
    const community = await ctx.db.get(args.communityId)
    if (!community) throw new Error("Community not found")

    if (community.type === "secret") {
      throw new Error("Secret communities can only be joined by direct invitation")
    }

    const existing = await getMembership(ctx, args.communityId, currentUser._id)
    if (existing) {
      if (existing.role === "pending") {
        throw new Error("You already have a pending request to join this community")
      }
      throw new Error("You are already a member of this community")
    }

    if (community.type === "private") {
      // Create pending membership
      return await ctx.db.insert("communityMembers", {
        communityId: args.communityId,
        userId: currentUser._id,
        role: "pending",
        joinedAt: Date.now(),
      })
    }

    // Public: join directly
    await ctx.db.insert("communityMembers", {
      communityId: args.communityId,
      userId: currentUser._id,
      role: "member",
      joinedAt: Date.now(),
    })

    await ctx.db.patch(args.communityId, {
      memberCount: community.memberCount + 1,
    })

    return "joined"
  },
})

/**
 * Request to join a private community (alias for joinCommunity for private communities).
 */
export const requestToJoin = mutation({
  args: { communityId: v.id("communities") },
  handler: async (ctx, args) => {
    const currentUser = await getAuthenticatedUser(ctx)
    const community = await ctx.db.get(args.communityId)
    if (!community) throw new Error("Community not found")
    if (community.type !== "private") {
      throw new Error("Only private communities require a join request")
    }

    const existing = await getMembership(ctx, args.communityId, currentUser._id)
    if (existing) throw new Error("You already have a membership or pending request")

    return await ctx.db.insert("communityMembers", {
      communityId: args.communityId,
      userId: currentUser._id,
      role: "pending",
      joinedAt: Date.now(),
    })
  },
})

/**
 * Approve a pending join request (admin/owner only).
 */
export const approveJoinRequest = mutation({
  args: {
    communityId: v.id("communities"),
    userId: v.id("users"),
  },
  handler: async (ctx, args) => {
    const currentUser = await getAuthenticatedUser(ctx)

    const adminMembership = await getMembership(ctx, args.communityId, currentUser._id)
    if (
      !adminMembership ||
      (adminMembership.role !== "owner" &&
        adminMembership.role !== "admin")
    ) {
      throw new Error("Only admins and owners can approve join requests")
    }

    const pendingMembership = await getMembership(ctx, args.communityId, args.userId)
    if (!pendingMembership || pendingMembership.role !== "pending") {
      throw new Error("No pending request found for this user")
    }

    const community = await ctx.db.get(args.communityId)
    if (!community) throw new Error("Community not found")

    await ctx.db.patch(pendingMembership._id, { role: "member" })
    await ctx.db.patch(args.communityId, {
      memberCount: community.memberCount + 1,
    })
  },
})

/**
 * Leave a community.
 */
export const leaveCommunity = mutation({
  args: { communityId: v.id("communities") },
  handler: async (ctx, args) => {
    const currentUser = await getAuthenticatedUser(ctx)
    const community = await ctx.db.get(args.communityId)
    if (!community) throw new Error("Community not found")

    const membership = await getMembership(ctx, args.communityId, currentUser._id)
    if (!membership) throw new Error("You are not a member of this community")
    if (membership.role === "owner") {
      throw new Error("Owners cannot leave their community. Transfer ownership or delete it.")
    }

    await ctx.db.delete(membership._id)

    if (membership.role !== "pending") {
      await ctx.db.patch(args.communityId, {
        memberCount: Math.max(0, community.memberCount - 1),
      })
    }
  },
})

/**
 * Update community info (admin/owner only).
 */
export const updateCommunity = mutation({
  args: {
    communityId: v.id("communities"),
    name: v.optional(v.string()),
    description: v.optional(v.string()),
    type: v.optional(
      v.union(v.literal("public"), v.literal("private"), v.literal("secret"))
    ),
    category: v.optional(v.string()),
    rules: v.optional(v.array(v.string())),
    avatar: v.optional(v.string()),
    banner: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const currentUser = await getAuthenticatedUser(ctx)

    const membership = await getMembership(ctx, args.communityId, currentUser._id)
    if (
      !membership ||
      (membership.role !== "owner" && membership.role !== "admin")
    ) {
      throw new Error("Only admins and owners can update community settings")
    }

    const updates: Record<string, any> = {}
    if (args.name !== undefined) {
      const name = args.name.trim()
      if (!name) throw new Error("Community name is required")
      if (name.length > 100) throw new Error("Community name too long (max 100 characters)")
      updates.name = name
    }
    if (args.description !== undefined) {
      if (args.description.length > 2000) throw new Error("Description too long (max 2000 characters)")
      updates.description = args.description.trim()
    }
    if (args.type !== undefined) updates.type = args.type
    if (args.category !== undefined) {
      if (!VALID_CATEGORIES.includes(args.category)) {
        throw new Error("Invalid category")
      }
      updates.category = args.category
    }
    if (args.rules !== undefined) {
      if (args.rules.length > 20) throw new Error("Too many rules (max 20)")
      for (const rule of args.rules) {
        if (rule.length > 500) throw new Error("Rule too long (max 500 characters)")
      }
      updates.rules = args.rules
    }
    if (args.avatar !== undefined) updates.avatar = args.avatar
    if (args.banner !== undefined) updates.banner = args.banner

    await ctx.db.patch(args.communityId, updates)
  },
})

/**
 * Delete a community (owner only). Cascades: removes members and community posts association.
 */
export const deleteCommunity = mutation({
  args: { communityId: v.id("communities") },
  handler: async (ctx, args) => {
    const currentUser = await getAuthenticatedUser(ctx)

    const membership = await getMembership(ctx, args.communityId, currentUser._id)
    if (!membership || membership.role !== "owner") {
      throw new Error("Only the owner can delete a community")
    }

    // Delete all members
    const members = await ctx.db
      .query("communityMembers")
      .withIndex("by_community", (q: any) => q.eq("communityId", args.communityId))
      .collect()
    for (const m of members) {
      await ctx.db.delete(m._id)
    }

    // Unset communityId on posts associated with this community
    const communityPosts = await ctx.db
      .query("posts")
      .withIndex("by_community", (q: any) => q.eq("communityId", args.communityId))
      .collect()
    for (const post of communityPosts) {
      await ctx.db.patch(post._id, { communityId: undefined })
    }

    // Delete events associated with this community
    const communityEvents = await ctx.db
      .query("events")
      .withIndex("by_community", (q: any) => q.eq("communityId", args.communityId))
      .collect()
    for (const event of communityEvents) {
      // Delete event RSVPs
      const rsvps = await ctx.db
        .query("eventRSVPs")
        .withIndex("by_event", (q: any) => q.eq("eventId", event._id))
        .collect()
      for (const rsvp of rsvps) {
        await ctx.db.delete(rsvp._id)
      }
      await ctx.db.delete(event._id)
    }

    await ctx.db.delete(args.communityId)
  },
})

/**
 * Add a member directly (admin/owner — for secret communities, invitations).
 */
export const addMember = mutation({
  args: {
    communityId: v.id("communities"),
    userId: v.id("users"),
  },
  handler: async (ctx, args) => {
    const currentUser = await getAuthenticatedUser(ctx)

    const adminMembership = await getMembership(ctx, args.communityId, currentUser._id)
    if (
      !adminMembership ||
      (adminMembership.role !== "owner" && adminMembership.role !== "admin")
    ) {
      throw new Error("Only admins and owners can add members")
    }

    const existing = await getMembership(ctx, args.communityId, args.userId)
    if (existing) throw new Error("User is already a member or has a pending request")

    const community = await ctx.db.get(args.communityId)
    if (!community) throw new Error("Community not found")

    await ctx.db.insert("communityMembers", {
      communityId: args.communityId,
      userId: args.userId,
      role: "member",
      joinedAt: Date.now(),
    })

    await ctx.db.patch(args.communityId, {
      memberCount: community.memberCount + 1,
    })
  },
})

/**
 * Remove a member (admin/owner only — cannot remove owner).
 */
export const removeMember = mutation({
  args: {
    communityId: v.id("communities"),
    userId: v.id("users"),
  },
  handler: async (ctx, args) => {
    const currentUser = await getAuthenticatedUser(ctx)

    const adminMembership = await getMembership(ctx, args.communityId, currentUser._id)
    if (
      !adminMembership ||
      (adminMembership.role !== "owner" && adminMembership.role !== "admin")
    ) {
      throw new Error("Only admins and owners can remove members")
    }

    const targetMembership = await getMembership(ctx, args.communityId, args.userId)
    if (!targetMembership) throw new Error("User is not a member")
    if (targetMembership.role === "owner") {
      throw new Error("Cannot remove the community owner")
    }

    const community = await ctx.db.get(args.communityId)
    if (!community) throw new Error("Community not found")

    await ctx.db.delete(targetMembership._id)
    if (targetMembership.role !== "pending") {
      await ctx.db.patch(args.communityId, {
        memberCount: Math.max(0, community.memberCount - 1),
      })
    }
  },
})

/**
 * Update a member's role (owner/admin only — cannot demote owner).
 */
export const updateMemberRole = mutation({
  args: {
    communityId: v.id("communities"),
    userId: v.id("users"),
    role: v.union(
      v.literal("admin"),
      v.literal("moderator"),
      v.literal("member")
    ),
  },
  handler: async (ctx, args) => {
    const currentUser = await getAuthenticatedUser(ctx)

    const adminMembership = await getMembership(ctx, args.communityId, currentUser._id)
    if (!adminMembership || adminMembership.role !== "owner") {
      throw new Error("Only the owner can update member roles")
    }

    const targetMembership = await getMembership(ctx, args.communityId, args.userId)
    if (!targetMembership) throw new Error("User is not a member")
    if (targetMembership.role === "owner") {
      throw new Error("Cannot change the owner's role")
    }

    await ctx.db.patch(targetMembership._id, { role: args.role })
  },
})

// ────────────────────────────────────────────
// Queries
// ────────────────────────────────────────────

/**
 * Get a community by its slug.
 */
export const getCommunity = query({
  args: { slug: v.string() },
  handler: async (ctx, args) => {
    const community = await ctx.db
      .query("communities")
      .withIndex("by_slug", (q) => q.eq("slug", args.slug))
      .unique()

    if (!community) return null

    // Attach viewer membership info if logged in
    const identity = await ctx.auth.getUserIdentity()
    let viewerMembership = null
    if (identity) {
      const currentUser = await ctx.db
        .query("users")
        .withIndex("by_clerkId", (q) => q.eq("clerkId", identity.subject))
        .unique()
      if (currentUser) {
        viewerMembership = await getMembership(ctx, community._id, currentUser._id)
      }
    }

    return {
      ...community,
      viewerRole: viewerMembership?.role ?? null,
    }
  },
})

/**
 * List communities, optionally filtered by category.
 */
export const getCommunities = query({
  args: {
    category: v.optional(v.string()),
    search: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    let allCommunities

    if (args.category && args.category !== "All") {
      allCommunities = await ctx.db
        .query("communities")
        .withIndex("by_category", (q) => q.eq("category", args.category!))
        .collect()
    } else {
      allCommunities = await ctx.db
        .query("communities")
        .withIndex("by_member_count")
        .order("desc")
        .collect()
    }

    // Filter out secret communities from public listing
    let communities = allCommunities.filter((c) => c.type !== "secret")

    // Apply search filter
    if (args.search) {
      const lower = args.search.toLowerCase()
      communities = communities.filter(
        (c) =>
          c.name.toLowerCase().includes(lower) ||
          c.description.toLowerCase().includes(lower)
      )
    }

    // Attach viewer membership info
    const identity = await ctx.auth.getUserIdentity()
    let currentUser = null
    if (identity) {
      currentUser = await ctx.db
        .query("users")
        .withIndex("by_clerkId", (q) => q.eq("clerkId", identity.subject))
        .unique()
    }

    const result = await Promise.all(
      communities.map(async (community) => {
        let viewerRole = null
        if (currentUser) {
          const membership = await getMembership(ctx, community._id, currentUser._id)
          viewerRole = membership?.role ?? null
        }
        return { ...community, viewerRole }
      })
    )

    return result
  },
})

/**
 * Get communities the current user has joined.
 */
export const getMyCommunities = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity()
    if (!identity) return []

    const currentUser = await ctx.db
      .query("users")
      .withIndex("by_clerkId", (q) => q.eq("clerkId", identity.subject))
      .unique()
    if (!currentUser) return []

    const memberships = await ctx.db
      .query("communityMembers")
      .withIndex("by_user", (q) => q.eq("userId", currentUser._id))
      .collect()

    const communities = await Promise.all(
      memberships
        .filter((m) => m.role !== "pending")
        .map(async (m) => {
          const community = await ctx.db.get(m.communityId)
          if (!community) return null
          return { ...community, viewerRole: m.role }
        })
    )

    return communities.filter(Boolean)
  },
})

/**
 * Get members of a community (paginated).
 */
export const getCommunityMembers = query({
  args: {
    communityId: v.id("communities"),
    includePending: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const community = await ctx.db.get(args.communityId)
    if (!community) return []

    // For non-public communities, require membership
    const identity = await ctx.auth.getUserIdentity()
    if (community.type !== "public") {
      if (!identity) return []
      const currentUser = await ctx.db
        .query("users")
        .withIndex("by_clerkId", (q) => q.eq("clerkId", identity.subject))
        .unique()
      if (!currentUser) return []
      const membership = await getMembership(ctx, args.communityId, currentUser._id)
      if (!membership) return []
    }

    const memberships = await ctx.db
      .query("communityMembers")
      .withIndex("by_community", (q) => q.eq("communityId", args.communityId))
      .collect()

    const filtered = args.includePending
      ? memberships
      : memberships.filter((m) => m.role !== "pending")

    const members = await Promise.all(
      filtered.map(async (m) => {
        const user = await ctx.db.get(m.userId)
        if (!user) return null
        return {
          _id: m._id,
          userId: user._id,
          name: user.name,
          username: user.username,
          role: m.role,
          joinedAt: m.joinedAt,
          profilePicture: user.profilePicture,
        }
      })
    )

    return members.filter(Boolean)
  },
})

/**
 * Get posts within a community.
 */
export const getCommunityPosts = query({
  args: { communityId: v.id("communities") },
  handler: async (ctx, args) => {
    const community = await ctx.db.get(args.communityId)
    if (!community) return []

    // For secret communities, require membership
    if (community.type === "secret") {
      const identity = await ctx.auth.getUserIdentity()
      if (!identity) return []
      const currentUser = await ctx.db
        .query("users")
        .withIndex("by_clerkId", (q) => q.eq("clerkId", identity.subject))
        .unique()
      if (!currentUser) return []
      const membership = await getMembership(ctx, args.communityId, currentUser._id)
      if (!membership || membership.role === "pending") return []
    }

    const posts = await ctx.db
      .query("posts")
      .withIndex("by_community", (q) => q.eq("communityId", args.communityId))
      .order("desc")
      .take(50)

    const result = await Promise.all(
      posts.map(async (post) => {
        const author = await ctx.db.get(post.authorId)
        return {
          ...post,
          author: author
            ? {
                _id: author._id,
                name: author.name,
                username: author.username,
                profilePicture: author.profilePicture,
              }
            : null,
        }
      })
    )

    return result
  },
})

// ────────────────────────────────────────────
// Invite System
// ────────────────────────────────────────────

/**
 * Send a direct invite to a user to join a community (admin/owner only).
 */
export const inviteUser = mutation({
  args: {
    communityId: v.id("communities"),
    userId: v.id("users"),
  },
  handler: async (ctx, args) => {
    const user = await getAuthUser(ctx)
    const community = await ctx.db.get(args.communityId)
    if (!community) throw new Error("Community not found")

    const membership = await getMembership(ctx, args.communityId, user._id)
    if (!membership || (membership.role !== "owner" && membership.role !== "admin")) {
      throw new Error("Only admins and owners can invite users")
    }

    if (args.userId === user._id) throw new Error("Cannot invite yourself")

    const targetUser = await ctx.db.get(args.userId)
    if (!targetUser) throw new Error("User not found")

    const existingMembership = await getMembership(ctx, args.communityId, args.userId)
    if (existingMembership) throw new Error("User is already a member or has a pending request")

    const existingInvite = await ctx.db
      .query("communityInvites")
      .withIndex("by_community_user", (q: any) =>
        q.eq("communityId", args.communityId).eq("invitedUserId", args.userId)
      )
      .filter((q: any) => q.eq(q.field("status"), "pending"))
      .unique()
    if (existingInvite) throw new Error("An invite is already pending for this user")

    const inviteId = await ctx.db.insert("communityInvites", {
      communityId: args.communityId,
      invitedUserId: args.userId,
      invitedBy: user._id,
      status: "pending",
      createdAt: Date.now(),
    })

    return inviteId
  },
})

/**
 * Accept a community invite.
 */
export const acceptInvite = mutation({
  args: { inviteId: v.id("communityInvites") },
  handler: async (ctx, args) => {
    const user = await getAuthUser(ctx)
    const invite = await ctx.db.get(args.inviteId)
    if (!invite) throw new Error("Invite not found")
    if (invite.invitedUserId !== user._id) throw new Error("This invite is not for you")
    if (invite.status !== "pending") throw new Error("Invite is no longer pending")

    const community = await ctx.db.get(invite.communityId)
    if (!community) throw new Error("Community no longer exists")

    const existingMembership = await getMembership(ctx, invite.communityId, user._id)
    if (existingMembership) {
      await ctx.db.patch(args.inviteId, { status: "accepted" })
      return
    }

    await ctx.db.insert("communityMembers", {
      communityId: invite.communityId,
      userId: user._id,
      role: "member",
      joinedAt: Date.now(),
    })

    await ctx.db.patch(invite.communityId, {
      memberCount: community.memberCount + 1,
    })

    await ctx.db.patch(args.inviteId, { status: "accepted" })
  },
})

/**
 * Decline a community invite.
 */
export const declineInvite = mutation({
  args: { inviteId: v.id("communityInvites") },
  handler: async (ctx, args) => {
    const user = await getAuthUser(ctx)
    const invite = await ctx.db.get(args.inviteId)
    if (!invite) throw new Error("Invite not found")
    if (invite.invitedUserId !== user._id) throw new Error("This invite is not for you")
    if (invite.status !== "pending") throw new Error("Invite is no longer pending")

    await ctx.db.patch(args.inviteId, { status: "declined" })
  },
})

/**
 * Revoke a sent invite (admin/owner only).
 */
export const revokeInvite = mutation({
  args: { inviteId: v.id("communityInvites") },
  handler: async (ctx, args) => {
    const user = await getAuthUser(ctx)
    const invite = await ctx.db.get(args.inviteId)
    if (!invite) throw new Error("Invite not found")
    if (invite.status !== "pending") throw new Error("Invite is no longer pending")

    const membership = await getMembership(ctx, invite.communityId, user._id)
    if (!membership || (membership.role !== "owner" && membership.role !== "admin")) {
      throw new Error("Only admins and owners can revoke invites")
    }

    await ctx.db.patch(args.inviteId, { status: "revoked" })
  },
})

/**
 * Get pending invites for a community (admin/owner view).
 */
export const getCommunityInvites = query({
  args: { communityId: v.id("communities") },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity()
    if (!identity) return []
    const currentUser = await ctx.db
      .query("users")
      .withIndex("by_clerkId", (q: any) => q.eq("clerkId", identity.subject))
      .unique()
    if (!currentUser) return []

    const membership = await getMembership(ctx, args.communityId, currentUser._id)
    if (!membership || (membership.role !== "owner" && membership.role !== "admin")) {
      return []
    }

    const invites = await ctx.db
      .query("communityInvites")
      .withIndex("by_community", (q: any) => q.eq("communityId", args.communityId))
      .filter((q: any) => q.eq(q.field("status"), "pending"))
      .collect()

    const enriched = await Promise.all(
      invites.map(async (invite) => {
        const invitedUser = await ctx.db.get(invite.invitedUserId)
        const inviter = await ctx.db.get(invite.invitedBy)
        return {
          ...invite,
          invitedUser: invitedUser
            ? { name: invitedUser.name, profilePicture: invitedUser.profilePicture }
            : null,
          inviter: inviter ? { name: inviter.name } : null,
        }
      })
    )

    return enriched
  },
})

/**
 * Get pending invites for the current user.
 */
export const getMyInvites = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity()
    if (!identity) return []
    const currentUser = await ctx.db
      .query("users")
      .withIndex("by_clerkId", (q: any) => q.eq("clerkId", identity.subject))
      .unique()
    if (!currentUser) return []

    const invites = await ctx.db
      .query("communityInvites")
      .withIndex("by_invited_user", (q: any) => q.eq("invitedUserId", currentUser._id))
      .filter((q: any) => q.eq(q.field("status"), "pending"))
      .collect()

    const enriched = await Promise.all(
      invites.map(async (invite) => {
        const community = await ctx.db.get(invite.communityId)
        const inviter = await ctx.db.get(invite.invitedBy)
        return {
          ...invite,
          community: community
            ? { name: community.name, slug: community.slug, avatarUrl: community.avatarUrl }
            : null,
          inviter: inviter ? { name: inviter.name } : null,
        }
      })
    )

    return enriched
  },
})