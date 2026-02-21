"use client"

import { useQuery } from "convex/react"
import { useUser } from "@clerk/nextjs"
import { api } from "@/convex/_generated/api"
import Image from "next/image"
import Link from "next/link"
import { Sparkles, TrendingUp, ChevronRight, MessageCircle, Heart } from "lucide-react"
import { Id } from "@/convex/_generated/dataModel"

interface RecommendedPostsProps {
  /** Maximum posts to show (default 3) */
  limit?: number
  /** Section title */
  title?: string
}

export function RecommendedPosts({ limit = 3, title = "Posts you might like" }: RecommendedPostsProps) {
  const { isLoaded, isSignedIn } = useUser()
  const recommended = useQuery(
    api.recommendations.getRecommendedPosts,
    isLoaded && isSignedIn ? { limit } : "skip"
  )

  // Loading skeleton
  if (recommended === undefined || recommended === null) {
    return (
      <div className="rounded-lg border border-border bg-card p-4">
        <div className="flex items-center justify-between mb-3">
          <div className="h-5 w-40 rounded bg-muted bg-muted animate-pulse" />
        </div>
        <div className="space-y-3">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="rounded-lg border border-border border-border p-3">
              <div className="flex items-center gap-2 mb-2">
                <div className="h-6 w-6 rounded-full bg-muted bg-muted animate-pulse" />
                <div className="h-4 w-20 rounded bg-muted bg-muted animate-pulse" />
              </div>
              <div className="space-y-1">
                <div className="h-3 w-full rounded bg-muted bg-muted animate-pulse" />
                <div className="h-3 w-3/4 rounded bg-muted bg-muted animate-pulse" />
              </div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  // Empty state
  if (recommended.items.length === 0) {
    return (
      <div className="rounded-lg border border-border bg-card p-4">
        <h3 className="flex items-center gap-2 text-sm font-semibold text-foreground mb-3">
          <Sparkles className="h-4 w-4 text-amber-500" />
          {title}
        </h3>
        <p className="text-sm text-muted-foreground text-center py-4">
          Interact with posts to get personalised recommendations!
        </p>
      </div>
    )
  }

  return (
    <div className="rounded-lg border border-border bg-card p-4">
      <div className="flex items-center justify-between mb-3">
        <h3 className="flex items-center gap-2 text-sm font-semibold text-foreground">
          <Sparkles className="h-4 w-4 text-amber-500" />
          {title}
        </h3>
        <Link
          href="/explore"
          className="flex items-center gap-1 text-xs text-primary hover:underline"
        >
          Explore
          <ChevronRight className="h-3 w-3" />
        </Link>
      </div>

      <div className="space-y-2">
        {recommended.items.map((item) => {
          const post = item.post
          const author = post.author
          if (!author) return null

          // Truncate content to ~80 chars
          const truncated =
            post.content.length > 80
              ? post.content.slice(0, 80).trimEnd() + "…"
              : post.content

          const totalReactions = post.reactionCounts
            ? post.reactionCounts.like +
              post.reactionCounts.love +
              post.reactionCounts.laugh +
              post.reactionCounts.wow +
              post.reactionCounts.sad +
              (post.reactionCounts as any).scholarly
            : post.likeCount

          return (
            <Link
              key={item._id}
              href={`/post/${item._id}`}
              className="block rounded-lg border border-border border-border p-3 transition-colors hover:bg-accent/50"
            >
              {/* Author row */}
              <div className="flex items-center gap-2 mb-1.5">
                {author.profilePicture ? (
                  <Image
                    src={author.profilePicture}
                    alt={author.name}
                    width={20}
                    height={20}
                    className="rounded-full"
                  />
                ) : (
                  <div className="h-5 w-5 rounded-full bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center text-[10px] font-bold text-primary-foreground">
                    {author.name.charAt(0).toUpperCase()}
                  </div>
                )}
                <span className="text-xs font-medium text-foreground truncate">
                  {author.name}
                </span>
                <span className="text-[10px] text-muted-foreground ml-auto">
                  {formatTimeAgo(post.createdAt)}
                </span>
              </div>

              {/* Content preview */}
              <p className="text-xs text-muted-foreground leading-relaxed line-clamp-2">
                {truncated}
              </p>

              {/* Engagement stats */}
              <div className="flex items-center gap-3 mt-2 text-[10px] text-muted-foreground">
                {totalReactions > 0 && (
                  <span className="flex items-center gap-0.5">
                    <Heart className="h-3 w-3" />
                    {totalReactions}
                  </span>
                )}
                {post.commentCount > 0 && (
                  <span className="flex items-center gap-0.5">
                    <MessageCircle className="h-3 w-3" />
                    {post.commentCount}
                  </span>
                )}
              </div>
            </Link>
          )
        })}
      </div>
    </div>
  )
}

// ── Trending In Skill Widget ──
interface TrendingInSkillProps {
  skill?: string
  limit?: number
}

export function TrendingInSkill({ skill, limit = 5 }: TrendingInSkillProps) {
  const { isLoaded, isSignedIn } = useUser()
  const trending = useQuery(
    api.recommendations.getTrendingInSkill,
    isLoaded && isSignedIn ? { skill, limit } : "skip"
  )

  if (trending === undefined || trending === null) {
    return (
      <div className="rounded-lg border border-border bg-card p-4">
        <div className="h-5 w-36 rounded bg-muted bg-muted animate-pulse mb-3" />
        <div className="space-y-2">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-12 rounded bg-muted bg-muted animate-pulse" />
          ))}
        </div>
      </div>
    )
  }

  if (trending.items.length === 0) {
    return null // Don't show empty trending section
  }

  return (
    <div className="rounded-lg border border-border bg-card p-4">
      <h3 className="flex items-center gap-2 text-sm font-semibold text-foreground mb-3">
        <TrendingUp className="h-4 w-4 text-orange-500" />
        Trending in {trending.skills.length > 0 ? trending.skills.join(", ") : "your skills"}
      </h3>
      <div className="space-y-2">
        {trending.items.map((item) => {
          const post = item.post
          const author = post.author
          if (!author) return null

          const truncated =
            post.content.length > 60
              ? post.content.slice(0, 60).trimEnd() + "…"
              : post.content

          return (
            <Link
              key={item._id}
              href={`/post/${item._id}`}
              className="flex items-start gap-2 rounded-md p-2 transition-colors hover:bg-accent/50"
            >
              <div className="flex-1 min-w-0">
                <p className="text-xs font-medium text-foreground truncate">
                  {author.name}
                </p>
                <p className="text-[11px] text-muted-foreground line-clamp-1">
                  {truncated}
                </p>
              </div>
              <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
                <Heart className="h-3 w-3" />
                {(post.reactionCounts
                  ? (post.reactionCounts as any).like +
                    (post.reactionCounts as any).love +
                    (post.reactionCounts as any).laugh
                  : post.likeCount) || 0}
              </div>
            </Link>
          )
        })}
      </div>
    </div>
  )
}

// ── Popular In University Widget ──
interface PopularInUniversityProps {
  limit?: number
}

export function PopularInUniversity({ limit = 5 }: PopularInUniversityProps) {
  const { isLoaded, isSignedIn } = useUser()
  const popular = useQuery(
    api.recommendations.getPopularInUniversity,
    isLoaded && isSignedIn ? { limit } : "skip"
  )

  if (popular === undefined || popular === null) {
    return (
      <div className="rounded-lg border border-border bg-card p-4">
        <div className="h-5 w-36 rounded bg-muted bg-muted animate-pulse mb-3" />
        <div className="space-y-2">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-12 rounded bg-muted bg-muted animate-pulse" />
          ))}
        </div>
      </div>
    )
  }

  if (popular.items.length === 0 || !popular.university) {
    return null
  }

  return (
    <div className="rounded-lg border border-border bg-card p-4">
      <h3 className="flex items-center gap-2 text-sm font-semibold text-foreground mb-3">
        <TrendingUp className="h-4 w-4 text-primary" />
        Popular at {popular.university}
      </h3>
      <div className="space-y-2">
        {popular.items.map((item) => {
          const post = item.post
          const author = post.author
          if (!author) return null

          const truncated =
            post.content.length > 60
              ? post.content.slice(0, 60).trimEnd() + "…"
              : post.content

          return (
            <Link
              key={item._id}
              href={`/post/${item._id}`}
              className="flex items-start gap-2 rounded-md p-2 transition-colors hover:bg-accent/50"
            >
              <div className="flex-1 min-w-0">
                <p className="text-xs font-medium text-foreground truncate">
                  {author.name}
                </p>
                <p className="text-[11px] text-muted-foreground line-clamp-1">
                  {truncated}
                </p>
              </div>
              <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
                <MessageCircle className="h-3 w-3" />
                {post.commentCount || 0}
              </div>
            </Link>
          )
        })}
      </div>
    </div>
  )
}

// ── Helper ──
function formatTimeAgo(timestamp: number): string {
  const diff = Date.now() - timestamp
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return "now"
  if (mins < 60) return `${mins}m`
  const hours = Math.floor(mins / 60)
  if (hours < 24) return `${hours}h`
  const days = Math.floor(hours / 24)
  if (days < 7) return `${days}d`
  const weeks = Math.floor(days / 7)
  return `${weeks}w`
}
