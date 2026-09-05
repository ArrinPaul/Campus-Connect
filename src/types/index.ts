/**
 * Shared frontend type definitions.
 * Import these instead of using inline `any` or locally-redefined interfaces.
 */

import type { Id } from "@/lib/api"

// ─── Reaction Types ───────────────────────────────────────────────────────────

export type ReactionType = "like" | "love" | "laugh" | "wow" | "sad" | "scholarly"

export interface ReactionCounts {
  like: number
  love: number
  laugh: number
  wow: number
  sad: number
  scholarly: number
}

// ─── Post Types ───────────────────────────────────────────────────────────────

// Matches the real Supabase row shape (see DbPost in src/server/db/posts.ts)
// — these used to be Convex-style camelCase (_id/authorId/likeCount/
// createdAt as a number), which don't exist on the actual API response.
// VirtualizedFeed.tsx force-cast real feed data through `as unknown as
// Post` to paper over the mismatch, meaning every post rendered by the
// main feed was silently passed an undefined id to every interactive
// action (like, comment, delete, repost, bookmark).
export interface PostAuthor {
  id: Id<"users">
  name: string
  profile_picture?: string
  role: "Student" | "Research Scholar" | "Faculty"
  username?: string
}

export interface PostLinkPreview {
  url: string
  title?: string
  description?: string
  image?: string
  favicon?: string
}

/** Full post shape used by PostCard and feed-related components */
export interface Post {
  id: Id<"posts">
  author_id: Id<"users">
  content: string
  like_count?: number
  comment_count?: number
  share_count?: number
  created_at?: string
  updated_at?: string
  media_urls?: string[]
  media_type?: "image" | "video" | "file" | "link"
  media_file_names?: string[]
  link_preview?: PostLinkPreview
  poll_id?: Id<"polls">
  community_id?: Id<"communities">
}

/** Feed item – may be a regular post or a repost */
export interface FeedItem {
  _id: Id<"posts">
  type: "post" | "repost"
  authorId: Id<"users">
  content: string
  likeCount: number
  commentCount: number
  shareCount: number
  createdAt: number
  updatedAt: number
  reactionCounts?: ReactionCounts
  mediaUrls?: string[]
  mediaType?: "image" | "video" | "file" | "link"
  mediaFileNames?: string[]
  linkPreview?: PostLinkPreview
  pollId?: Id<"polls">
  communityId?: Id<"communities">
  // Repost-specific fields
  originalPostId?: Id<"posts">
  reposterId?: Id<"users">
  reposterName?: string
}

// ─── User Types ───────────────────────────────────────────────────────────────

export type UserRole = "Student" | "Research Scholar" | "Faculty"
export type ExperienceLevel = "Beginner" | "Intermediate" | "Advanced" | "Expert"
export type UserStatus = "online" | "away" | "dnd" | "invisible"
export type EmailDigestFrequency = "daily" | "weekly" | "never"

export interface UserSocialLinks {
  github?: string
  linkedin?: string
  twitter?: string
  website?: string
}

// ─── Ad Types ────────────────────────────────────────────────────────────────

export interface AdAnalyticsItem {
  _id: Id<"ads">
  title: string
  status: "active" | "paused" | "expired"
  impressions: number
  clicks: number
  budget: number
  spent: number
  createdAt: number
}

// ─── Bookmark Types ──────────────────────────────────────────────────────────

export interface BookmarkItem {
  _id: Id<"bookmarks">
  postId: Id<"posts">
  post?: Post
  collectionName?: string
  createdAt: number
}

// ─── Utility ─────────────────────────────────────────────────────────────────

/** Sum all reaction counts for a post */
export function totalReactions(counts: ReactionCounts): number {
  return counts.like + counts.love + counts.laugh + counts.wow + counts.sad + counts.scholarly
}
