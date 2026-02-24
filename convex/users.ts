import { v } from "convex/values";
import {
  internalMutation,
  internalAction,
  query,
  mutation,
  action,
} from "./_generated/server";
import { Id } from "./_generated/dataModel";
import { internal } from "./_generated/api";
import { sanitizeText, isValidSafeUrl } from "./sanitize";
import { createLogger } from "./logger";
import { BIO_MAX_LENGTH, UNIVERSITY_MAX_LENGTH } from "./validation_constants";

const log = createLogger("users");

// ╔════════════════════════════════════════════════════════════════════════╗
// ║                            WEBHOOK HANDLERS                            ║
// ╚════════════════════════════════════════════════════════════════════════╝

export const createUserFromWebhook = internalMutation({
  args: {
    clerkId: v.string(),
    email: v.string(),
    name: v.string(),
    profilePicture: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const existingUser = await ctx.db
      .query("users")
      .withIndex("by_clerkId", (q) => q.eq("clerkId", args.clerkId))
      .first();
    if (existingUser) {
      log.info("User already exists, skipping creation", { clerkId: args.clerkId });
      return existingUser._id;
    }
    const userId = await ctx.db.insert("users", {
      clerkId: args.clerkId,
      email: args.email,
      name: args.name,
      profilePicture: args.profilePicture,
      bio: "",
      university: "",
      role: "Student",
      experienceLevel: "Beginner",
      skills: [],
      socialLinks: {},
      followerCount: 0,
      followingCount: 0,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });
    log.info("User created", { userId, clerkId: args.clerkId });
    return userId;
  },
});

export const updateUserFromWebhook = internalMutation({
  args: {
    clerkId: v.string(),
    email: v.string(),
    name: v.string(),
    profilePicture: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const user = await ctx.db
      .query("users")
      .withIndex("by_clerkId", (q) => q.eq("clerkId", args.clerkId))
      .first();
    if (!user) {
      log.error("User not found for update", { clerkId: args.clerkId });
      throw new Error("User not found");
    }
    await ctx.db.patch(user._id, {
      email: args.email,
      name: args.name,
      profilePicture: args.profilePicture,
      updatedAt: Date.now(),
    });
    log.info("User updated", { userId: user._id, clerkId: args.clerkId });
    return user._id;
  },
});

export const deleteUserFromWebhook = internalMutation({
  args: {
    clerkId: v.string(),
  },
  handler: async (ctx, args) => {
    const user = await ctx.db
      .query("users")
      .withIndex("by_clerkId", (q) => q.eq("clerkId", args.clerkId))
      .first();
    if (!user) {
      log.warn("User not found for deletion, skipping.", { clerkId: args.clerkId });
      return;
    }
    await ctx.scheduler.runAfter(0, internal.users.deleteUserAccount, {
      userId: user._id,
      clerkId: user.clerkId,
    });
    log.info("Scheduled account deletion action for user.", { userId: user._id });
  },
});

export const deleteUserAccount = internalAction({
  args: {
    userId: v.id("users"),
    clerkId: v.string(),
  },
  handler: async (ctx, args) => {
    log.info("Starting user account deletion workflow...", { userId: args.userId });

    await Promise.all([
      ctx.runMutation(internal.users.cleanupPosts, { userId: args.userId }),
      ctx.runMutation(internal.users.cleanupComments, { userId: args.userId }),
      ctx.runMutation(internal.users.cleanupReactions, { userId: args.userId }),
      ctx.runMutation(internal.users.cleanupReposts, { userId: args.userId }),
      ctx.runMutation(internal.users.cleanupBookmarks, { userId: args.userId }),
      ctx.runMutation(internal.users.cleanupFollows, { userId: args.userId }),
      ctx.runMutation(internal.users.cleanupNotifications, {
        userId: args.userId,
      }),
      ctx.runMutation(internal.users.cleanupCommunityMemberships, {
        userId: args.userId,
      }),
      ctx.runMutation(internal.users.cleanupStories, { userId: args.userId }),
      ctx.runMutation(internal.users.cleanupPolls, { userId: args.userId }),
      ctx.runMutation(internal.users.cleanupConversations, { userId: args.userId }),
    ]);

    await ctx.runMutation(internal.users.deleteUserDocument, { userId: args.userId });

    log.info("Successfully completed user account deletion workflow.", {
      userId: args.userId,
    });
  },
});

export const cleanupPosts = internalMutation({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    const posts = await ctx.db
      .query("posts")
      .withIndex("by_author", (q) => q.eq("authorId", args.userId))
      .collect();
    for (const post of posts) {
        // Note: This still has a cascade issue, but it's now confined.
        // A better solution would be another action for post deletion.
        const comments = await ctx.db.query("comments").withIndex("by_post", q => q.eq("postId", post._id)).collect();
        for(const comment of comments) {
            await ctx.db.delete(comment._id);
        }
        await ctx.db.delete(post._id);
    }
  },
});
export const cleanupComments = internalMutation({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    const comments = await ctx.db
        .query("comments")
        .withIndex("by_author", q => q.eq("authorId", args.userId))
        .collect();
    for (const comment of comments) {
        await ctx.scheduler.runAfter(0, internal.counters.decrementPostCounts, {
            postId: comment.postId,
            commentCount: 1,
        });
        await ctx.db.delete(comment._id);
    }
  },
});
export const cleanupReactions = internalMutation({
    args: { userId: v.id("users") },
    handler: async (ctx, args) => {
        const reactions = await ctx.db
            .query("reactions")
            .withIndex("by_user", q => q.eq("userId", args.userId))
            .collect();
        for (const reaction of reactions) {
            await ctx.scheduler.runAfter(0, internal.counters.updateReactionCounts, {
                targetId: reaction.targetId as Id<"posts">,
                reactionType: reaction.type,
                delta: -1,
            });
            await ctx.db.delete(reaction._id);
        }
    }
});
export const cleanupReposts = internalMutation({
    args: { userId: v.id("users") },
    handler: async (ctx, args) => {
        const reposts = await ctx.db.query("reposts").withIndex("by_user", q => q.eq("userId", args.userId)).collect();
        for (const repost of reposts) {
            await ctx.scheduler.runAfter(0, internal.counters.decrementPostCounts, {
                postId: repost.originalPostId,
                shareCount: 1,
            });
            await ctx.db.delete(repost._id);
        }
    }
});
export const cleanupBookmarks = internalMutation({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    const bookmarks = await ctx.db.query("bookmarks").withIndex("by_user", q => q.eq("userId", args.userId)).collect();
    for (const bookmark of bookmarks) {
        await ctx.db.delete(bookmark._id);
    }
  },
});
export const cleanupFollows = internalMutation({
    args: { userId: v.id("users") },
    handler: async (ctx, args) => {
        const following = await ctx.db.query("follows").withIndex("by_follower", q => q.eq("followerId", args.userId)).collect();
        for (const follow of following) {
            await ctx.scheduler.runAfter(0, internal.counters.updateUserFollowCounts, {
                userId: follow.followingId,
                followerDelta: -1,
            });
            await ctx.db.delete(follow._id);
        }
        const followers = await ctx.db.query("follows").withIndex("by_following", q => q.eq("followingId", args.userId)).collect();
        for (const follow of followers) {
            await ctx.scheduler.runAfter(0, internal.counters.updateUserFollowCounts, {
                userId: follow.followerId,
                followingDelta: -1,
            });
            await ctx.db.delete(follow._id);
        }
    }
});
export const cleanupNotifications = internalMutation({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    const notifications = await ctx.db.query("notifications").withIndex("by_recipient", q => q.eq("recipientId", args.userId)).collect();
    for (const notification of notifications) {
        await ctx.db.delete(notification._id);
    }
    const sentNotifications = await ctx.db.query("notifications").withIndex("by_actor", q => q.eq("actorId", args.userId)).collect();
    for (const notification of sentNotifications) {
        await ctx.db.delete(notification._id);
    }
  },
});
export const cleanupCommunityMemberships = internalMutation({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    const memberships = await ctx.db.query("communityMembers").withIndex("by_user", q => q.eq("userId", args.userId)).collect();
    for(const membership of memberships) {
        await ctx.scheduler.runAfter(0, internal.counters.updateCommunityMemberCount, {
            communityId: membership.communityId,
            delta: -1,
        });
        await ctx.db.delete(membership._id);
    }
  },
});
export const cleanupStories = internalMutation({
    args: { userId: v.id("users") },
    handler: async (ctx, args) => {
        const stories = await ctx.db.query("stories").withIndex("by_author", q => q.eq("authorId", args.userId)).collect();
        for(const story of stories) {
            const views = await ctx.db.query("storyViews").withIndex("by_story", q => q.eq("storyId", story._id)).collect();
            for(const view of views) {
                await ctx.db.delete(view._id);
            }
            await ctx.db.delete(story._id);
        }
    }
});
export const cleanupPolls = internalMutation({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    const polls = await ctx.db.query("polls").withIndex("by_author", q => q.eq("authorId", args.userId)).collect();
    for(const poll of polls) {
        const votes = await ctx.db.query("pollVotes").withIndex("by_poll", q => q.eq("pollId", poll._id)).collect();
        for(const vote of votes) {
            await ctx.db.delete(vote._id);
        }
        await ctx.db.delete(poll._id);
    }
  },
});
export const cleanupConversations = internalMutation({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
     const participations = await ctx.db.query("conversationParticipants").withIndex("by_user", q => q.eq("userId", args.userId)).collect();
     for(const p of participations) {
         await ctx.db.delete(p._id);
     }
  },
});
export const deleteUserDocument = internalMutation({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    await ctx.db.delete(args.userId);
    log.info("Final user document deleted.", { userId: args.userId });
  },
});

export const getCurrentUser = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return null;
    return await ctx.db
      .query("users")
      .withIndex("by_clerkId", (q) => q.eq("clerkId", identity.subject))
      .first();
  },
});

const safeUserProjection = {
  _id: true,
  name: true,
  username: true,
  profilePicture: true,
  bio: true,
  university: true,
  role: true,
  experienceLevel: true,
  skills: true,
  socialLinks: true,
  followerCount: true,
  followingCount: true,
  isVerified: true,
  isPro: true,
  reputation: true,
  level: true,
  createdAt: true,
}

function projectUser(user: any) {
  if (!user) return null;
  const projectedUser: any = {};
  for (const key in safeUserProjection) {
    projectedUser[key] = user[key];
  }
  return projectedUser;
}

export const getUserById = query({
  args: {
    userId: v.id("users"),
  },
  handler: async (ctx, args) => {
    const user = await ctx.db.get(args.userId)
    return projectUser(user)
  },
})

export const searchUsers = query({
  args: {
    query: v.optional(v.string()),
    role: v.optional(
      v.union(
        v.literal("Student"),
        v.literal("Research Scholar"),
        v.literal("Faculty")
      )
    ),
    skills: v.optional(v.array(v.string())),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return [];

    const currentUser = await ctx.db
      .query("users")
      .withIndex("by_clerkId", (q: any) => q.eq("clerkId", identity.subject))
      .unique();

    const searchTerm = args.query?.trim().toLowerCase() ?? "";
    if (!searchTerm) return [];

    // Fetch a pool of users and filter in memory (replace with search index for scale)
    const allUsers = await ctx.db.query("users").take(500);
    
    let results = allUsers.filter((user) => {
      if (currentUser && user._id === currentUser._id) return false;
      const nameMatch = user.name?.toLowerCase().includes(searchTerm);
      const usernameMatch = user.username?.toLowerCase().includes(searchTerm);
      return nameMatch || usernameMatch;
    });

    if (args.role) {
      results = results.filter((u) => u.role === args.role);
    }

    if (args.skills && args.skills.length > 0) {
      results = results.filter((u) =>
        u.skills?.some((s: string) => args.skills!.includes(s))
      );
    }

    return results.slice(0, 20).map((u) => ({
      _id: u._id,
      name: u.name,
      username: u.username,
      profilePicture: u.profilePicture,
      bio: u.bio,
      role: u.role,
      university: u.university,
    }));
  },
})

export const searchUsersByUsername = query({
  args: {
    query: v.string(),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    if (!args.query?.trim()) return [];
    // This is still unscalable and should be replaced with search index
    const users = await ctx.db.query("users").take(500);
    return users.filter(user => user.name.includes(args.query)).slice(0, args.limit ?? 5);
  },
})

export const getUserByUsername = query({
  args: {
    username: v.string(),
  },
  handler: async (ctx, args) => {
    if (!args.username) return null;
    const user = await ctx.db
      .query("users")
      .withIndex("by_username", (q) => q.eq("username", args.username))
      .first();
    return projectUser(user);
  },
});

export const getUserByIdOrUsername = query({
  args: {
    idOrUsername: v.string(),
  },
  handler: async (ctx, args) => {
    if (!args.idOrUsername) return null;
    let user = null;
    try {
      user = await ctx.db.get(args.idOrUsername as Id<"users">);
    } catch {}
    if (!user) {
      user = await ctx.db
        .query("users")
        .withIndex("by_username", (q) => q.eq("username", args.idOrUsername))
        .first();
    }
    return projectUser(user);
  },
});

export const updateProfile = mutation({
  args: {
    bio: v.optional(v.string()),
    university: v.optional(v.string()),
    role: v.optional(
      v.union(
        v.literal("Student"),
        v.literal("Research Scholar"),
        v.literal("Faculty")
      )
    ),
    experienceLevel: v.optional(
      v.union(
        v.literal("Beginner"),
        v.literal("Intermediate"),
        v.literal("Advanced"),
        v.literal("Expert")
      )
    ),
    socialLinks: v.optional(
      v.object({
        github: v.optional(v.string()),
        linkedin: v.optional(v.string()),
        twitter: v.optional(v.string()),
        website: v.optional(v.string()),
      })
    ),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Unauthorized");
    const user = await ctx.db
      .query("users")
      .withIndex("by_clerkId", (q) => q.eq("clerkId", identity.subject))
      .first();
    if (!user) throw new Error("User not found");
    const updates: any = { updatedAt: Date.now() };
    if (args.bio) updates.bio = sanitizeText(args.bio);
    if (args.university) updates.university = sanitizeText(args.university);
    if (args.role) updates.role = args.role;
    if (args.experienceLevel) updates.experienceLevel = args.experienceLevel;
    if (args.socialLinks) {
        updates.socialLinks = args.socialLinks;
    }
    await ctx.db.patch(user._id, updates);
    return user._id;
  },
});

export const addSkill = mutation({
  args: {
    skill: v.string(),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Unauthorized");
    const user = await ctx.db
      .query("users")
      .withIndex("by_clerkId", (q) => q.eq("clerkId", identity.subject))
      .first();
    if (!user) throw new Error("User not found");
    const sanitizedSkill = sanitizeText(args.skill);
    if(user.skills.includes(sanitizedSkill)) return user.skills;
    const updatedSkills = [...user.skills, sanitizedSkill];
    await ctx.db.patch(user._id, {
      skills: updatedSkills,
    });
    return updatedSkills;
  },
});

export const removeSkill = mutation({
  args: {
    skill: v.string(),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Unauthorized");
    const user = await ctx.db
      .query("users")
      .withIndex("by_clerkId", (q) => q.eq("clerkId", identity.subject))
      .first();
    if (!user) throw new Error("User not found");
    const updatedSkills = user.skills.filter((s) => s !== args.skill);
    await ctx.db.patch(user._id, {
      skills: updatedSkills,
    });
    return updatedSkills;
  },
});

export const updateNotificationPreferences = mutation({
  args: {
    reactions: v.boolean(),
    comments: v.boolean(),
    mentions: v.boolean(),
    follows: v.boolean(),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Unauthorized");
    const user = await ctx.db
      .query("users")
      .withIndex("by_clerkId", (q) => q.eq("clerkId", identity.subject))
      .unique();
    if (!user) throw new Error("User not found");
    await ctx.db.patch(user._id, {
      notificationPreferences: args,
    });
  },
});

export const generateUploadUrl = mutation(async (ctx) => {
    return await ctx.storage.generateUploadUrl();
});

export const updateProfilePicture = mutation({
  args: {
    storageId: v.id("_storage"),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Unauthorized");
    const user = await ctx.db
      .query("users")
      .withIndex("by_clerkId", (q) => q.eq("clerkId", identity.subject))
      .first();
    if (!user) throw new Error("User not found");
    const url = await ctx.storage.getUrl(args.storageId);
    await ctx.db.patch(user._id, { profilePicture: url ?? undefined });
    return url;
  },
});

export const exportUserData = query({
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Unauthorized");
    const user = await ctx.db
      .query("users")
      .withIndex("by_clerkId", (q) => q.eq("clerkId", identity.subject))
      .unique();
    if (!user) throw new Error("User not found");
    return { user };
  },
});

export const deleteAccount = mutation({
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Unauthorized");
    const user = await ctx.db
      .query("users")
      .withIndex("by_clerkId", (q) => q.eq("clerkId", identity.subject))
      .unique();
    if (!user) throw new Error("User not found");
    await ctx.scheduler.runAfter(0, internal.users.deleteUserAccount, {
      userId: user._id,
      clerkId: user.clerkId,
    });
    return { success: true, message: "Account deletion process has started." };
  },
});

export const completeOnboarding = mutation({
  args: {
    name: v.string(),
    username: v.string(),
    bio: v.optional(v.string()),
    university: v.optional(v.string()),
    role: v.union(
      v.literal("Student"),
      v.literal("Research Scholar"),
      v.literal("Faculty")
    ),
    skills: v.array(v.string()),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Unauthorized");
    const user = await ctx.db
      .query("users")
      .withIndex("by_clerkId", (q) => q.eq("clerkId", identity.subject))
      .first();
    if (!user) throw new Error("User not found");

    await ctx.db.patch(user._id, {
      name: sanitizeText(args.name),
      username: sanitizeText(args.username),
      bio: args.bio ? sanitizeText(args.bio) : undefined,
      university: args.university ? sanitizeText(args.university) : undefined,
      role: args.role,
      skills: args.skills.map(sanitizeText),
      onboardingComplete: true,
    });
  },
});

export const getOnboardingStatus = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity()
    if (!identity) return null

    const user = await ctx.db
      .query("users")
      .withIndex("by_clerkId", (q) => q.eq("clerkId", identity.subject))
      .first()

    return {
      complete: user?.onboardingComplete ?? false,
      userId: user?._id ?? null,
    }
  },
})
