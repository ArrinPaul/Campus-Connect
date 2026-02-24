import { v } from "convex/values";
import { query, mutation, internalAction, internalQuery, internalMutation } from "./_generated/server";
import { Id } from "./_generated/dataModel";
import { internal } from "./_generated/api";
import { sanitizeMarkdown } from "./sanitize";
import { POST_MAX_LENGTH } from "./validation_constants";
import { checkRateLimit, RATE_LIMITS, getAuthenticatedUser, getAuthenticatedUserOrNull, requireOnboarding } from "./_lib";
import { linkHashtagsToPost } from "./hashtags";

export const getFeedPosts = query({
  args: {
    cursor: v.optional(v.string()),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const user = await getAuthenticatedUserOrNull(ctx);
    if (!user) return { posts: [], hasMore: false, nextCursor: null };

    const limit = args.limit ?? 10;
    
    const feed = await ctx.db
        .query("userFeed")
        .withIndex("by_user", q => q.eq("userId", user._id))
        .order("desc")
        .paginate({ cursor: args.cursor ?? null, numItems: limit });
    
    const posts = await Promise.all(
        feed.page.map(async (item) => {
            const post = await ctx.db.get(item.postId);
            if(!post) return null;
            const author = await ctx.db.get(post.authorId);
            return { ...post, author };
        })
    );

    return {
        posts: posts.filter(Boolean),
        hasMore: !feed.isDone,
        nextCursor: feed.continueCursor,
    }
  },
});

export const getPostById = query({
  args: {
    postId: v.id("posts"),
  },
  handler: async (ctx, args) => {
    const post = await ctx.db.get(args.postId);
    if (!post) return null;
    const author = await ctx.db.get(post.authorId);
    return { ...post, author };
  },
});

export const createPost = mutation({
  args: {
    content: v.string(),
    mediaUrls: v.optional(v.array(v.string())),
    mediaType: v.optional(v.union(v.literal("image"), v.literal("video"), v.literal("file"), v.literal("link"))),
    mediaFileNames: v.optional(v.array(v.string())),
    linkPreview: v.optional(v.object({
      url: v.string(),
      title: v.optional(v.string()),
      description: v.optional(v.string()),
      image: v.optional(v.string()),
      favicon: v.optional(v.string()),
    })),
    pollId: v.optional(v.id("polls")),
    communityId: v.optional(v.id("communities")),
  },
  handler: async (ctx, args) => {
    const user = await getAuthenticatedUser(ctx);
    await checkRateLimit(ctx, user._id, "createPost", RATE_LIMITS.createPost);

    if (!args.content.trim()) throw new Error("Post content cannot be empty");
    if (args.content.length > POST_MAX_LENGTH) {
      throw new Error(`Post content must not exceed ${POST_MAX_LENGTH} characters`);
    }

    // Verify community membership if posting to a community
    if (args.communityId) {
      const membership = await ctx.db
        .query("communityMembers")
        .withIndex("by_community_user", (q: any) =>
          q.eq("communityId", args.communityId).eq("userId", user._id)
        )
        .unique();
      if (!membership || membership.role === "pending") {
        throw new Error("You must be a member of this community to post");
      }
    }

    const sanitizedContent = sanitizeMarkdown(args.content);

    const postId = await ctx.db.insert("posts", {
      authorId: user._id,
      content: sanitizedContent,
      likeCount: 0,
      commentCount: 0,
      shareCount: 0,
      mediaUrls: args.mediaUrls,
      mediaType: args.mediaType,
      mediaFileNames: args.mediaFileNames,
      linkPreview: args.linkPreview,
      pollId: args.pollId,
      communityId: args.communityId,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });

    // Extract & link hashtags from post content
    await linkHashtagsToPost(ctx, postId, sanitizedContent);

    await ctx.scheduler.runAfter(0, internal.posts.fanOutPost, {
      postId,
      authorId: user._id,
    });

    return postId;
  },
});

export const fanOutPost = internalAction({
  args: {
    postId: v.id("posts"),
    authorId: v.id("users"),
  },
  handler: async (ctx, args) => {
    const followers = await ctx.runQuery(internal.posts.getFollowers, { authorId: args.authorId });
    
    await ctx.runMutation(internal.posts.addToFeed, {
        userId: args.authorId,
        postId: args.postId
    });

    for (const follower of followers) {
      await ctx.runMutation(internal.posts.addToFeed, {
        userId: follower.followerId,
        postId: args.postId,
      });
    }
  },
});

export const getFollowers = internalQuery({
    args: { authorId: v.id("users") },
    handler: async (ctx, args) => {
        return await ctx.db
            .query("follows")
            .withIndex("by_following", q => q.eq("followingId", args.authorId))
            .collect();
    }
});

export const addToFeed = internalMutation({
    args: {
        userId: v.id("users"),
        postId: v.id("posts"),
    },
    handler: async (ctx, args) => {
        await ctx.db.insert("userFeed", {
            userId: args.userId,
            postId: args.postId,
            createdAt: Date.now(),
        })
    }
})

export const deletePost = mutation({
  args: {
    postId: v.id("posts"),
  },
  handler: async (ctx, args) => {
    const user = await getAuthenticatedUser(ctx);
    const post = await ctx.db.get(args.postId);
    if (!post) throw new Error("Post not found");
    if (post.authorId !== user._id) throw new Error("Forbidden");

    await ctx.scheduler.runAfter(0, internal.posts.deletePostAction, {
        postId: args.postId,
    });
  }
});

export const deletePostAction = internalAction({
    args: { postId: v.id("posts") },
    handler: async (ctx, args) => {
        await Promise.all([
            ctx.runMutation(internal.posts.cleanupPostComments, { postId: args.postId }),
            ctx.runMutation(internal.posts.cleanupPostReactions, { postId: args.postId }),
            ctx.runMutation(internal.posts.cleanupPostReposts, { postId: args.postId }),
            ctx.runMutation(internal.posts.cleanupPostBookmarks, { postId: args.postId }),
            ctx.runMutation(internal.posts.cleanupPostLikes, { postId: args.postId }),
            ctx.runMutation(internal.posts.cleanupPostHashtags, { postId: args.postId }),
            ctx.runMutation(internal.posts.cleanupPostPolls, { postId: args.postId }),
            ctx.runMutation(internal.posts.cleanupPostNotifications, { postId: args.postId }),
            ctx.runMutation(internal.posts.cleanupPostFeedEntries, { postId: args.postId }),
        ]);

        await ctx.runMutation(internal.posts.deletePostDocument, { postId: args.postId });
    }
})

export const cleanupPostComments = internalMutation({
    args: { postId: v.id("posts") },
    handler: async (ctx, args) => {
        const comments = await ctx.db.query("comments").withIndex("by_post", q => q.eq("postId", args.postId)).collect();
        for(const comment of comments) {
            await ctx.db.delete(comment._id);
        }
    }
})

export const cleanupPostReactions = internalMutation({
    args: { postId: v.id("posts") },
    handler: async (ctx, args) => {
        const reactions = await ctx.db.query("reactions").withIndex("by_target", q => q.eq("targetId", args.postId)).collect();
        for(const reaction of reactions) {
            await ctx.db.delete(reaction._id);
        }
    }
})

export const cleanupPostReposts = internalMutation({
    args: { postId: v.id("posts") },
    handler: async (ctx, args) => {
        const reposts = await ctx.db.query("reposts").withIndex("by_original_post", q => q.eq("originalPostId", args.postId)).collect();
        for(const repost of reposts) {
            await ctx.db.delete(repost._id);
        }
    }
})

export const cleanupPostBookmarks = internalMutation({
    args: { postId: v.id("posts") },
    handler: async (ctx, args) => {
        const bookmarks = await ctx.db.query("bookmarks").withIndex("by_post", q => q.eq("postId", args.postId)).collect();
        for(const bookmark of bookmarks) {
            await ctx.db.delete(bookmark._id);
        }
    }
})

export const cleanupPostLikes = internalMutation({
    args: { postId: v.id("posts") },
    handler: async (ctx, args) => {
        const likes = await ctx.db.query("likes").withIndex("by_post", q => q.eq("postId", args.postId)).collect();
        for (const like of likes) {
            await ctx.db.delete(like._id);
        }
    }
})

export const cleanupPostHashtags = internalMutation({
    args: { postId: v.id("posts") },
    handler: async (ctx, args) => {
        const postHashtags = await ctx.db.query("postHashtags").withIndex("by_post", q => q.eq("postId", args.postId)).collect();
        for (const ph of postHashtags) {
            // Decrement hashtag postCount
            const hashtag = await ctx.db.get(ph.hashtagId);
            if (hashtag && hashtag.postCount > 0) {
                await ctx.db.patch(hashtag._id, { postCount: hashtag.postCount - 1 });
            }
            await ctx.db.delete(ph._id);
        }
    }
})

export const cleanupPostPolls = internalMutation({
    args: { postId: v.id("posts") },
    handler: async (ctx, args) => {
        const polls = await ctx.db.query("polls").withIndex("by_post", q => q.eq("postId", args.postId)).collect();
        for (const poll of polls) {
            // Delete poll votes first
            const votes = await ctx.db.query("pollVotes").withIndex("by_poll", q => q.eq("pollId", poll._id)).collect();
            for (const vote of votes) {
                await ctx.db.delete(vote._id);
            }
            await ctx.db.delete(poll._id);
        }
    }
})

export const cleanupPostNotifications = internalMutation({
    args: { postId: v.id("posts") },
    handler: async (ctx, args) => {
        // notifications.referenceId is a string, matching postId
        const postIdStr = args.postId as string;
        const notifications = await ctx.db.query("notifications").collect();
        for (const notif of notifications) {
            if (notif.referenceId === postIdStr) {
                await ctx.db.delete(notif._id);
            }
        }
    }
})

export const cleanupPostFeedEntries = internalMutation({
    args: { postId: v.id("posts") },
    handler: async (ctx, args) => {
        const entries = await ctx.db.query("userFeed")
            .filter(q => q.eq(q.field("postId"), args.postId))
            .collect();
        for (const entry of entries) {
            await ctx.db.delete(entry._id);
        }
    }
})

export const deletePostDocument = internalMutation({
    args: { postId: v.id("posts") },
    handler: async (ctx, args) => {
        await ctx.db.delete(args.postId);
    }
})

export const likePost = mutation({
  args: {
    postId: v.id("posts"),
  },
  handler: async (ctx, args) => {
    const user = await requireOnboarding(ctx);
    const post = await ctx.db.get(args.postId);
    if (!post) throw new Error("Post not found");

    const existingReaction = await ctx.db
      .query("reactions")
      .withIndex("by_user_target", (q) =>
        q.eq("userId", user._id).eq("targetId", args.postId).eq("targetType", "post")
      )
      .unique();
    if (existingReaction) throw new Error("Already liked");

    await ctx.db.insert("reactions", {
      userId: user._id,
      targetId: args.postId,
      targetType: "post",
      type: "like",
      createdAt: Date.now(),
    });

    await ctx.scheduler.runAfter(0, internal.counters.updateReactionCounts, {
      targetId: args.postId,
      reactionType: "like",
      delta: 1,
    });
  },
});

export const unlikePost = mutation({
  args: {
    postId: v.id("posts"),
  },
  handler: async (ctx, args) => {
    const user = await requireOnboarding(ctx);
    const post = await ctx.db.get(args.postId);
    if (!post) throw new Error("Post not found");
    const existingReaction = await ctx.db
      .query("reactions")
      .withIndex("by_user_target", (q) =>
        q.eq("userId", user._id).eq("targetId", args.postId).eq("targetType", "post")
      )
      .unique();
    if (!existingReaction) throw new Error("Not liked");

    await ctx.db.delete(existingReaction._id);
    await ctx.scheduler.runAfter(0, internal.counters.updateReactionCounts, {
      targetId: args.postId,
      reactionType: existingReaction.type,
      delta: -1,
    });
  },
});

export const getExplorePosts = query({
  args: {
    limit: v.optional(v.number()),
    cursor: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    // Authentication is optional for explore feed, but if present,
    // we should still join author data.
    
    const limit = Math.min(args.limit ?? 20, 100);

    let postsQuery = ctx.db
      .query("posts")
      .withIndex("by_createdAt")
      .order("desc");

    if (args.cursor) {
      try {
        const cursorPost = await ctx.db.get(args.cursor as Id<"posts">);
        if (cursorPost) {
          postsQuery = postsQuery.filter((q) =>
            q.lt(q.field("createdAt"), cursorPost.createdAt)
          );
        }
      } catch {
        // Invalid cursor — return results from the beginning
      }
    }

    const posts = await postsQuery.take(limit + 1);

    const hasMore = posts.length > limit;
    const postsToReturn = hasMore ? posts.slice(0, limit) : posts;

    const postsWithAuthors = await Promise.all(
      postsToReturn.map(async (post) => {
        const author = await ctx.db.get(post.authorId);
        return {
          ...post,
          author: author || null,
        };
      })
    );

    return {
      posts: postsWithAuthors,
      nextCursor: hasMore ? postsToReturn[postsToReturn.length - 1]._id : null,
      hasMore,
    };
  },
});

export const getPostsByUserId = query({
  args: {
    userId: v.id("users"),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const limit = Math.min(args.limit ?? 30, 100);

    const posts = await ctx.db
      .query("posts")
      .withIndex("by_author", (q) => q.eq("authorId", args.userId))
      .order("desc")
      .take(limit);

    const postsWithAuthor = await Promise.all(
      posts.map(async (post) => {
        const author = await ctx.db.get(post.authorId);
        return { ...post, author: author || null };
      })
    );

    return postsWithAuthor;
  },
});
