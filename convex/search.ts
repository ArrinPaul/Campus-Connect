import { v } from "convex/values"
import { query } from "./_generated/server"
import { Id, Doc } from "./_generated/dataModel"

// ────────────────────────────────────────────
// Pure utility functions (exported for unit tests)
// ────────────────────────────────────────────

/** Levenshtein edit distance between two strings. */
export function editDistance(a: string, b: string): number {
  const m = a.length, n = b.length;
  const dp: number[][] = Array.from({ length: m + 1 }, (_, i) =>
    Array.from({ length: n + 1 }, (_, j) => (i === 0 ? j : j === 0 ? i : 0))
  );
  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      if (a[i - 1] === b[j - 1]) {
        dp[i][j] = dp[i - 1][j - 1];
      } else {
        dp[i][j] = 1 + Math.min(dp[i - 1][j], dp[i][j - 1], dp[i - 1][j - 1]);
      }
    }
  }
  return dp[m][n];
}

/**
 * Fuzzy match: returns true if `query` appears in (or is close enough to a
 * word in) `text`.  Supports multi-word queries (all words must match).
 *
 * @param query       The search term
 * @param text        The text to search within
 * @param maxDistance Optional cap on the allowed edit-distance per word
 *                    (defaults to proportional: floor(wordLen/3))
 */
export function fuzzyMatch(query: string, text: string, maxDistance?: number): boolean {
  const q = query.toLowerCase();
  const t = text.toLowerCase();

  // Simple substring / prefix / suffix containment
  if (t.includes(q)) return true;

  const queryWords = q.split(/\s+/).filter(Boolean);
  if (queryWords.length === 0) return true;

  const textWords = t.split(/\s+/).filter(Boolean);

  // Every query word must have at least one matching text word
  return queryWords.every(qw => {
    for (const tw of textWords) {
      // Containment: one includes the other
      if (qw.includes(tw) || tw.includes(qw)) return true;
      // Edit-distance fuzzy match
      const allowed = Math.min(
        maxDistance !== undefined ? maxDistance : Infinity,
        Math.floor(qw.length / 3)
      );
      if (allowed > 0 && editDistance(qw, tw) <= allowed) return true;
    }
    return false;
  });
}

/**
 * Returns a relevance score in [0, 1] for how well `query` matches `text`.
 * 1.0 = exact · 0.9 = prefix · 0.7 = substring · 0–0.6 = fuzzy · 0 = no match
 */
export function searchRelevanceScore(query: string, text: string): number {
  const q = query.trim().toLowerCase();
  const t = text.trim().toLowerCase();

  if (!q) return t === "" ? 1.0 : 0;
  if (!t) return 0;

  if (t === q) return 1.0;
  if (t.startsWith(q)) return 0.9;
  if (t.includes(q)) return 0.7;

  // Word-level scoring
  const textWords = t.split(/\s+/).filter(Boolean);
  let best = 0;
  for (const word of textWords) {
    if (word === q) { best = Math.max(best, 0.7); continue; }
    if (word.startsWith(q)) { best = Math.max(best, 0.6); continue; }
    if (word.includes(q) || q.includes(word)) { best = Math.max(best, 0.5); continue; }
    const dist = editDistance(q, word);
    const maxDist = Math.floor(q.length / 3);
    if (maxDist > 0 && dist <= maxDist) {
      const fuzzyScore = (1 - dist / Math.max(q.length, word.length)) * 0.6;
      best = Math.max(best, fuzzyScore);
    }
  }
  return best;
}

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
    .withIndex("by_community_user", (q: any) =>
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
      .withSearchIndex("by_search", (search) => search.search("name", q))
      .take(limitPerCategory);

    // --- Search Posts ---
    const posts = await ctx.db
      .query("posts")
      .withSearchIndex("by_content", (search) => search.search("content", q))
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
        .withSearchIndex("by_content", (search) => search.search("content", q))
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
                let query = search.search("name", q)
                if(args.role) {
                    query = query.eq("role", args.role as any)
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
