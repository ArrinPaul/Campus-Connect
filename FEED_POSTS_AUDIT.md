# Feed, Posts, Comments, Reactions, Reposts & Bookmarks — Feature Audit

**Date**: 2026-02-24  
**Scope**: Frontend, Backend, Schema, Integration  

---

## Executive Summary

Two parallel component systems exist:
1. **Full-featured** (`src/components/posts/`, `src/components/feed/`) — full reactions, comments, delete, bookmarks, media, polls, link previews.
2. **Simple/static** (`src/app/(components)/feed/`) — display-only PostCard with no mutation calls, non-functional action buttons.

**All actual app pages use the simple/static components.** The full-featured components are dead code (only referenced in unit tests). This makes most interactive post features non-functional in production.

---

## Issues

### FEED-01 — CRITICAL
**Feature**: Feed Loading / All Post Interactions  
**File(s)**: [src/app/(dashboard)/feed/page.tsx](src/app/(dashboard)/feed/page.tsx#L3), [src/app/(components)/feed/Feed.tsx](src/app/(components)/feed/Feed.tsx), [src/app/(components)/feed/FeedList.tsx](src/app/(components)/feed/FeedList.tsx#L5), [src/app/(components)/feed/PostCard.tsx](src/app/(components)/feed/PostCard.tsx)  
**Problem**: The feed page imports the simple `Feed` → `FeedList` → `PostCard` chain from `(components)/feed/`. This `PostCard` has **zero mutation calls** — its Like, Comment, Repost, and Bookmark buttons are purely visual with no `onClick` handlers that call any backend mutation. The full-featured `FeedContainer` + `PostCard` from `src/components/` is never imported by any page.

```tsx
// src/app/(components)/feed/PostCard.tsx lines 44-60 — buttons are decoration only
const PostActions = ({ post }: { post: FeedItem['post'] }) => (
    <div className="mt-4 flex items-center justify-between text-muted-foreground">
        <button className="flex items-center gap-2 ...">  {/* NO onClick */}
            <MessageCircle className="h-5 w-5" />
            <span>{post.commentCount}</span>
        </button>
        <button className="flex items-center gap-2 ...">  {/* NO onClick */}
            <Heart className="h-5 w-5" />
            <span>{post.likeCount}</span>
        </button>
        <button className="...">  {/* NO onClick */}
            <Bookmark className="h-5 w-5" />
        </button>
    </div>
)
```

**Fix**: Replace the feed page to use `FeedContainer` from `@/components/feed/FeedContainer` and `PostComposer` from `@/components/posts/PostComposer`, or port all interactive features into the `(components)/feed/PostCard.tsx`.

---

### FEED-02 — CRITICAL
**Feature**: All pages using PostCard — Search, Hashtag, Profile, Explore, Community, Bookmarks  
**File(s)**:  
- [src/app/(dashboard)/search/page.tsx](src/app/(dashboard)/search/page.tsx#L8)  
- [src/app/(dashboard)/hashtag/[tag]/page.tsx](src/app/(dashboard)/hashtag/%5Btag%5D/page.tsx#L9)  
- [src/app/(components)/profile/UserPostList.tsx](src/app/(components)/profile/UserPostList.tsx#L6)  
- [src/app/(components)/explore/ExplorePostGrid.tsx](src/app/(components)/explore/ExplorePostGrid.tsx#L5)  
- [src/app/(components)/communities/CommunityPostFeed.tsx](src/app/(components)/communities/CommunityPostFeed.tsx#L6)  
- [src/app/(components)/bookmarks/BookmarkedPostList.tsx](src/app/(components)/bookmarks/BookmarkedPostList.tsx#L5)  

**Problem**: Every page that renders posts imports the non-interactive `PostCard` from `(components)/feed/PostCard`. Users cannot react, comment, bookmark, delete, or share any post from any page.

**Fix**: Replace all imports site-wide to use the interactive `PostCard` from `@/components/posts/PostCard`, or unify into a single component.

---

### FEED-03 — HIGH
**Feature**: Feed Loading — No Pagination  
**File(s)**: [src/app/(components)/feed/FeedList.tsx](src/app/(components)/feed/FeedList.tsx#L12-L13)  
**Problem**: `FeedList` calls `getFeedPosts` without `cursor` or `limit` and renders all returned posts in a flat list. No infinite scroll, no "load more" button. The full-featured `FeedContainer.tsx` (with virtualized infinite scroll) is unused.

```tsx
// FeedList.tsx — no pagination support
const result = useQuery(api.posts.getFeedPosts, isAuthenticated ? {} : 'skip');
const posts = result?.posts ?? [];
```

**Fix**: Use `FeedContainer` (which supports cursor-based pagination with `InfiniteScrollTrigger`) or add pagination to `FeedList`.

---

### FEED-04 — LOW
**Feature**: Feed Loading — No Feed Type Tabs  
**File(s)**: [src/app/(components)/feed/FeedList.tsx](src/app/(components)/feed/FeedList.tsx)  
**Problem**: The active feed page only shows the "following" feed via `getFeedPosts`. The ranked ("For You"), trending, and chronological feeds from `feed_ranking.ts` (`getRankedFeed`, `getTrendingFeed`, `getChronologicalFeed`) are fully implemented in the backend and wired into `FeedContainer.tsx`, but `FeedContainer` is never mounted.

**Fix**: Use `FeedContainer` with feed type tabs or add feed type switching to the active feed page.

---

### POST-01 — HIGH
**Feature**: Delete Post — Missing cascade for postHashtags, userFeed, polls, notifications  
**File(s)**: [convex/posts.ts](convex/posts.ts#L169-L180)  
**Problem**: `deletePostAction` cascade deletes comments, reactions, reposts, and bookmarks, but does NOT clean up:
1. **`postHashtags`** — Orphaned join-table rows remain; `hashtags.postCount` never decremented.
2. **`userFeed`** — Orphaned feed entries point to deleted posts. `getFeedPosts` handles this with a null check, but the data grows unbounded.
3. **`polls`/`pollVotes`** — If the post has a `pollId`, the poll and its votes are never deleted.
4. **`notifications`** — Notifications referencing the deleted post remain.

```typescript
// posts.ts deletePostAction — missing cleanup steps
export const deletePostAction = internalAction({
    args: { postId: v.id("posts") },
    handler: async (ctx, args) => {
        await Promise.all([
            ctx.runMutation(internal.posts.cleanupPostComments, { postId: args.postId }),
            ctx.runMutation(internal.posts.cleanupPostReactions, { postId: args.postId }),
            ctx.runMutation(internal.posts.cleanupPostReposts, { postId: args.postId }),
            ctx.runMutation(internal.posts.cleanupPostBookmarks, { postId: args.postId }),
            // MISSING: cleanupPostHashtags, cleanupUserFeedEntries, cleanupPoll, cleanupNotifications
        ]);
        await ctx.runMutation(internal.posts.deletePostDocument, { postId: args.postId });
    }
})
```

**Fix**: Add `cleanupPostHashtags`, `cleanupUserFeedEntries`, `cleanupPoll`, and `cleanupNotifications` internal mutations and call them in the `deletePostAction`.

---

### POST-02 — HIGH
**Feature**: Edit Post  
**File(s)**: [convex/posts.ts](convex/posts.ts) (entire file)  
**Problem**: **No `editPost` / `updatePost` mutation exists.** There is no UI for editing a post either. Once a post is published, its content cannot be corrected. The schema has an `updatedAt` field that is set at creation but never updated.

**Fix**: Add an `editPost` mutation that validates ownership, sanitizes content, and updates `updatedAt`. Add an "Edit" option to the PostCard menu alongside "Delete".

---

### POST-03 — MEDIUM
**Feature**: Create Post — Duplicate simplified composer  
**File(s)**: [src/app/(components)/feed/CreatePost.tsx](src/app/(components)/feed/CreatePost.tsx#L117-L135)  
**Problem**: The `CreatePost` component used on the actual feed page has non-functional media buttons. The Image, Poll, and File buttons render icons but their `onClick` handlers do nothing (just `disabled` placeholders). No file upload, no poll creation, no link preview. Only plain text posting works.

```tsx
// CreatePost.tsx lines 121-131 — buttons are stubs
<button className="p-2 rounded-full hover:bg-primary/10 ..." disabled={isSubmitting}>
    <ImageIcon className="h-5 w-5" />    {/* NO onClick handler */}
</button>
<button className="p-2 rounded-full hover:bg-primary/10 ..." disabled={isSubmitting}>
    <ChartBar className="h-5 w-5" />     {/* NO onClick handler */}
</button>
<button className="p-2 rounded-full hover:bg-primary/10 ..." disabled={isSubmitting}>
    <File className="h-5 w-5" />         {/* NO onClick handler */}
</button>
```

**Fix**: Use the full `PostComposer` from `@/components/posts/PostComposer.tsx` (which has working file upload, poll creation, link preview, rich text editing), or wire up the buttons in `CreatePost.tsx`.

---

### POST-04 — MEDIUM
**Feature**: Create Post — `reactionCounts` not initialized  
**File(s)**: [convex/posts.ts](convex/posts.ts#L84-L95)  
**Problem**: `createPost` inserts a post without initializing `reactionCounts`. The schema defines it as `v.optional(...)`, so new posts have `reactionCounts: undefined`. Downstream code (feed ranking, reaction display) must null-check everywhere.

```typescript
const postId = await ctx.db.insert("posts", {
      authorId: user._id,
      content: sanitizedContent,
      likeCount: 0,
      commentCount: 0,
      shareCount: 0,
      // MISSING: reactionCounts: { like: 0, love: 0, laugh: 0, wow: 0, sad: 0, scholarly: 0 },
      ...
});
```

**Fix**: Initialize `reactionCounts` to `{ like: 0, love: 0, laugh: 0, wow: 0, sad: 0, scholarly: 0 }` in `createPost`.

---

### POST-05 — MEDIUM
**Feature**: Like/React to Post — Duplicate pathways  
**File(s)**: [convex/posts.ts](convex/posts.ts#L232-L282) (likePost/unlikePost), [convex/reactions.ts](convex/reactions.ts#L12-L130) (addReaction/removeReaction)  
**Problem**: Two independent mutation paths exist for reacting to a post:
1. `posts.likePost` / `posts.unlikePost` — inserts/deletes `reactions` rows and calls `counters.updateReactionCounts`.
2. `reactions.addReaction` / `reactions.removeReaction` — inserts/deletes `reactions` rows and calls its own inline `updateReactionCounts` helper.

Both write to the same `reactions` table but update `reactionCounts` via different mechanisms (`counters.ts` vs inline helper in `reactions.ts`). Using them interchangeably can cause count drift.

**Fix**: Deprecate/remove `posts.likePost`/`posts.unlikePost` and use only `reactions.addReaction`/`reactions.removeReaction`, or have them delegate to a single shared helper.

---

### POST-06 — LOW  
**Feature**: Post with Media — TODO in simple PostCard  
**File(s)**: [src/app/(components)/feed/PostCard.tsx](src/app/(components)/feed/PostCard.tsx#L82)  
**Problem**: The PostCard used in production has a `{/* TODO: Render media (images, link previews, etc.) */}` comment. Neither media, link previews, nor polls are rendered.

**Fix**: Add `MediaGallery`, `LinkPreviewCard`, and `PollCard` to the simple PostCard, or switch to the full PostCard.

---

### COMMENT-01 — MEDIUM
**Feature**: React to Comment — No UI  
**File(s)**: [src/components/posts/CommentList.tsx](src/components/posts/CommentList.tsx#L238-L275)  
**Problem**: The `ReactionPicker` component supports `targetType: "comment"` and the backend supports comment reactions. However, `CommentList.tsx` does not render a `ReactionPicker` for individual comments. There is no way for users to react to comments.

**Fix**: Add `<ReactionPicker targetId={comment._id} targetType="comment" compact />` to the comment action row in `CommentList.tsx`.

---

### COMMENT-02 — LOW
**Feature**: Comment sorting — Not wired  
**File(s)**: [src/components/posts/PostCard.tsx](src/components/posts/PostCard.tsx#L88-L90)  
**Problem**: `PostCard` fetches comments with `getPostComments` but does not pass `sortBy` or `onSortChange` to `CommentList`. The `CommentList` has a sort header that renders "best / new / old / controversial" buttons, but `onSortChange` is never provided so the header is invisible (conditional on `onSortChange` being truthy).

```tsx
// PostCard.tsx line 88 — no sortBy passed
<CommentList postId={post._id} comments={comments} isLoading={comments === undefined} />
// Missing: sortBy={sortBy} onSortChange={setSortBy}
```

**Fix**: Add `sortBy` state to `PostCard` and pass it along with `onSortChange` to `CommentList`. Pass `sortBy` to the `getPostComments` query args.

---

### REPOST-01 — MEDIUM
**Feature**: Undo Repost — No UI  
**File(s)**: [convex/reposts.ts](convex/reposts.ts#L94-L131) (backend exists), [src/components/posts/PostCard.tsx](src/components/posts/PostCard.tsx#L385-L395)  
**Problem**: `reposts.deleteRepost` mutation exists and works correctly (decrements shareCount, verifies ownership). However, there is no UI to undo a repost. The share dropdown only shows "Repost" (create) — never "Undo Repost". The `hasUserReposted` query exists but is never called in the frontend.

**Fix**: In `PostCard.tsx`, query `hasUserReposted` and conditionally show "Undo Repost" in the share dropdown if the user has already reposted.

---

### BOOKMARK-01 — MEDIUM
**Feature**: View Bookmarks Page — Missing collection filter  
**File(s)**: [src/app/(components)/bookmarks/BookmarkedPostList.tsx](src/app/(components)/bookmarks/BookmarkedPostList.tsx#L8)  
**Problem**: The bookmarks page calls `getBookmarks({})` without a `collectionName` argument. The backend supports filtering by collection name, and `getCollections` returns collection names with counts, but there is no collection switcher/filter UI on the bookmarks page.

```tsx
// BookmarkedPostList.tsx line 8 — always fetches all collections
const bookmarksData = useQuery(api.bookmarks.getBookmarks, {});
```

**Fix**: Add a collection sidebar or dropdown that passes the selected `collectionName` to `getBookmarks`. The `BookmarkButton` already supports creating and managing collections, so this is just a display gap.

---

### BOOKMARK-02 — HIGH
**Feature**: View Bookmarks Page — Uses non-interactive PostCard  
**File(s)**: [src/app/(components)/bookmarks/BookmarkedPostList.tsx](src/app/(components)/bookmarks/BookmarkedPostList.tsx#L5)  
**Problem**: Bookmarks page imports `PostCard` from `../../(components)/feed/PostCard` — the static version. Users cannot un-bookmark, react, comment, or interact with bookmarked posts from the bookmarks page.

**Fix**: Import the full `PostCard` from `@/components/posts/PostCard` instead.

---

### BOOKMARK-03 — MEDIUM
**Feature**: View Bookmarks Page — Missing pagination  
**File(s)**: [src/app/(components)/bookmarks/BookmarkedPostList.tsx](src/app/(components)/bookmarks/BookmarkedPostList.tsx#L8)  
**Problem**: `getBookmarks` supports cursor-based pagination (limit + cursor args), but `BookmarkedPostList` fetches with `{}` (default 20, no cursor). No "load more" or infinite scroll.

**Fix**: Add pagination or infinite scroll to `BookmarkedPostList`.

---

### BOOKMARK-04 — MEDIUM
**Feature**: View Bookmarks Page — Missing media/poll fields in response  
**File(s)**: [convex/bookmarks.ts](convex/bookmarks.ts#L155-L170)  
**Problem**: `getBookmarks` returns a subset of post fields but omits `mediaUrls`, `mediaType`, `mediaFileNames`, `linkPreview`, and `pollId`. Even if the PostCard is upgraded, bookmarked posts with media/polls/links would render without them.

```typescript
// bookmarks.ts lines 158-167 — missing fields
post: {
    _id: post._id,
    authorId: post.authorId,
    content: post.content,
    likeCount: post.likeCount,
    commentCount: post.commentCount,
    shareCount: post.shareCount,
    createdAt: post.createdAt,
    updatedAt: post.updatedAt,
    reactionCounts: post.reactionCounts,
    // MISSING: mediaUrls, mediaType, mediaFileNames, linkPreview, pollId
},
```

**Fix**: Spread the full post object instead of cherry-picking fields, or add the missing fields.

---

### FEED-05 — LOW
**Feature**: Feed for Community — No pagination  
**File(s)**: [convex/communities.ts](convex/communities.ts#L678)  
**Problem**: `getCommunityPosts` uses `.take(50)` — hardcoded limit with no pagination. Communities with many posts will be capped at 50.

**Fix**: Add cursor-based pagination (similar to `getFeedPosts`).

---

## Sub-Feature Status Summary

| Sub-Feature | Backend | Frontend | Integration | Status |
|---|---|---|---|---|
| **Create Post** (text only) | ✅ Working | ✅ Working (simple) | ✅ | **PARTIAL** — media/poll buttons non-functional |
| **Create Post** (rich: media, poll, link) | ✅ Working | ✅ Built (PostComposer) | ❌ Not mounted | **DEAD CODE** |
| **Delete Post** | ⚠️ Missing cascade (hashtags, feed, polls) | ✅ Built (full PostCard) | ❌ Not mounted | **DEAD CODE** |
| **Edit Post** | ❌ Missing | ❌ Missing | ❌ | **MISSING** |
| **Like/React to Post** | ✅ Working (2 duplicate paths) | ✅ Built (ReactionPicker) | ❌ Not mounted | **DEAD CODE** |
| **Bookmark Post** | ✅ Working | ✅ Built (BookmarkButton) | ❌ Not mounted | **DEAD CODE** |
| **Share/Repost** | ✅ Working | ✅ Built (RepostModal) | ❌ Not mounted | **DEAD CODE** |
| **Post with Poll** | ✅ Working | ✅ Built (PollCard + PostComposer) | ❌ Not mounted | **DEAD CODE** |
| **Post with Media** | ✅ Working | ✅ Built (MediaGallery + PostComposer) | ❌ Not mounted | **DEAD CODE** |
| **Post with Link Preview** | ✅ Working | ✅ Built (LinkPreviewCard + PostComposer) | ❌ Not mounted | **DEAD CODE** |
| **Feed Loading** | ✅ Working (cursor pagination) | ✅ Built (FeedContainer + VirtualizedFeed) | ❌ Uses simple FeedList instead | **DEGRADED** — no pagination |
| **Feed Ranking** (For You / Trending) | ✅ Working | ✅ Built (FeedContainer tabs) | ❌ Not mounted | **DEAD CODE** |
| **Feed for Community** | ✅ Working (no pagination) | ✅ Working (CreatePost) | ✅ | **WORKING** (limited) |
| **Create Comment** | ✅ Working | ✅ Built (CommentComposer) | ❌ Not mounted | **DEAD CODE** |
| **Delete Comment** | ✅ Working (cascade) | ✅ Built (CommentList) | ❌ Not mounted | **DEAD CODE** |
| **Reply to Comment** | ✅ Working (depth ≤ 5) | ✅ Built (CommentList) | ❌ Not mounted | **DEAD CODE** |
| **React to Comment** | ✅ Working | ❌ Not in CommentList UI | ❌ | **MISSING UI** |
| **Simple Repost** | ✅ Working | ✅ Built (PostCard dropdown) | ❌ Not mounted | **DEAD CODE** |
| **Quote Repost** | ✅ Working | ✅ Built (RepostModal) | ❌ Not mounted | **DEAD CODE** |
| **Undo Repost** | ✅ Working | ❌ No UI | ❌ | **MISSING UI** |
| **Add Bookmark** | ✅ Working | ✅ Built (BookmarkButton) | ❌ Not mounted | **DEAD CODE** |
| **Remove Bookmark** | ✅ Working | ✅ Built (BookmarkButton) | ❌ Not mounted | **DEAD CODE** |
| **View Bookmarks Page** | ✅ Working | ⚠️ Non-interactive PostCard | ⚠️ | **BROKEN** — can't interact |
| **Bookmark Collections** | ✅ Working | ✅ Built (BookmarkButton) | ❌ No filter on page | **PARTIAL** |

---

## Priority Fix Recommendations

1. **P0 — Wire up full-featured components**: Replace `(components)/feed/PostCard` usage across all pages with `@/components/posts/PostCard`. Replace `(components)/feed/Feed` with `FeedContainer` + `PostComposer`. This single change would unblock ~80% of the dead-code features.

2. **P1 — Post delete cascade**: Add cleanup for `postHashtags`, `userFeed`, `polls`/`pollVotes`, and `notifications`.

3. **P1 — Edit Post**: Implement `editPost` mutation + UI.

4. **P2 — Reaction deduplication**: Remove `posts.likePost`/`unlikePost` in favor of `reactions.addReaction`/`removeReaction`.

5. **P2 — Comment reactions UI**: Add `ReactionPicker` to `CommentList`.

6. **P2 — Undo repost UI**: Query `hasUserReposted` and show "Undo Repost" option.

7. **P3 — Bookmarks page**: Add collection filtering, pagination, return full post fields.

8. **P3 — Community feed pagination**: Add cursor support to `getCommunityPosts`.
