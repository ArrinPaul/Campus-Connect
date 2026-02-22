import { v } from "convex/values"
import { query } from "./_generated/server"
import { Id, Doc } from "./_generated/dataModel"

// ────────────────────────────────────────────
// Search Upgrades (Phase 4.4)
// This file is REFACTORED to use scalable full-text search indexes.
// ────────────────────────────────────────────

// Helper to check if a post is visible to the current user
async function isPostVisibleToUser(
  ctx: any,
  post: { communityId?: Id<"communities"> | null },
  userId?: Id<"users">
): Promise<boolean> {
  if (!post.communityId) return true; // Public post
  if (!userId) return false; // Not logged in, can't see secret community posts

  const community = await ctx.db.get(post.communityId);
  if (!community || community.type !== "secret") return true;

  const membership = await ctx.db
    .query("communityMembers")
    .withIndex("by_community_user", (q) =>
      q.eq("communityId", post.communityId!).eq("userId", userId)
    )
    .unique();
  return !!membership && membership.role !== "pending";
}

// Safe user projection to prevent leaking sensitive data
function projectUser(user: Doc<"users">) {
  return {
    _id: user._id,
    name: user.name,
    username: user.username,
    profilePicture: user.profilePicture,
    bio: user.bio,
    role: user.role,
    university: user.university,
  };
}

// ────────────────────────────────────────────
// Universal Search — searches across all types
// ────────────────────────────────────────────
export const universalSearch = query({
  args: {
    query: v.string(),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Unauthorized");
    const user = await ctx.db.query("users").withIndex("by_clerkId", q => q.eq("clerkId", identity.subject)).unique();


    const q = args.query.trim();
    if (!q) return { users: [], posts: [], hashtags: [] };

    const limitPerCategory = Math.min(args.limit ?? 5, 20);

    // --- Search Users ---
    const users = await ctx.db
      .query("users")
      .withSearchIndex("by_search", (search) => search.search(q))
      .take(limitPerCategory);

    // --- Search Posts ---
    const posts = await ctx.db
      .query("posts")
      .withSearchIndex("by_content", (search) => search.search(q))
      .take(limitPerCategory);
    
    // Enrich and filter posts for visibility
    const visiblePosts = [];
    for (const post of posts) {
      if (await isPostVisibleToUser(ctx, post, user?._id)) {
        const author = await ctx.db.get(post.authorId);
        visiblePosts.push({ ...post, author: author ? projectUser(author) : null });
      }
    }

    // --- Search Hashtags (remains a filter-based approach for now) ---
    const hashtags = await ctx.db
      .query("hashtags")
      .filter((q) => q.gt(q.field("postCount"), 0))
      .collect();
    const filteredHashtags = hashtags
      .filter(tag => tag.tag.toLowerCase().includes(q.toLowerCase().replace(/^#/, "")))
      .sort((a,b) => b.postCount - a.postCount)
      .slice(0, limitPerCategory)


    return {
      users: users.map(projectUser),
      posts: visiblePosts,
      hashtags: filteredHashtags,
    };
  },
});

// ────────────────────────────────────────────
// Search Posts — full-text search with filters
// ────────────────────────────────────────────
export const searchPosts = query({
  args: {
    query: v.string(),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Unauthorized");
    const user = await ctx.db.query("users").withIndex("by_clerkId", q => q.eq("clerkId", identity.subject)).unique();

    const q = args.query.trim();
    if (!q) return [];
    
    const posts = await ctx.db
        .query("posts")
        .withSearchIndex("by_content", (search) => search.search(q))
        .take(50);
    
    // Enrich and filter posts for visibility
    const results = [];
    for (const post of posts) {
        if (await isPostVisibleToUser(ctx, post, user?._id)) {
            const author = await ctx.db.get(post.authorId);
            results.push({ ...post, author: author ? projectUser(author) : null });
        }
    }

    return results;
  }
});


// ────────────────────────────────────────────
// Search Users — enhanced with scalable index
// ────────────────────────────────────────────
export const searchUsersEnhanced = query({
    args: {
        query: v.string(),
        role: v.optional(v.string()),
        university: v.optional(v.string()),
        skills: v.optional(v.array(v.string())),
    },
    handler: async (ctx, args) => {
        const identity = await ctx.auth.getUserIdentity();
        if (!identity) throw new Error("Unauthorized");

        const q = args.query.trim();
        if (!q) return [];
        
        const users = await ctx.db
            .query("users")
            .withSearchIndex("by_search", (search) => {
                let query = search.search(q)
                if(args.role) {
                    query = query.eq("role", args.role)
                }
                if(args.university) {
                    query = query.eq("university", args.university)
                }
                if(args.skills && args.skills.length > 0) {
                    // This is not supported in search filters directly yet.
                    // Post-filtering is still needed for array contains.
                }
                return query;
            })
            .take(50);
        
        let filteredUsers = users;
        if (args.skills && args.skills.length > 0) {
            const skillsLower = args.skills.map(s => s.toLowerCase());
            filteredUsers = users.filter(u => 
                u.skills.some(userSkill => skillsLower.includes(userSkill.toLowerCase()))
            )
        }

        return filteredUsers.map(projectUser);
    }
})
