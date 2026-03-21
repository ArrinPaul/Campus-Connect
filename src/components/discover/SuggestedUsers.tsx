"use client"

import { useState, useCallback } from "react"
import { useUser } from "@/lib/auth/client"
import { useMutation } from "@/lib/api"
import { api } from "@/lib/api"
import Image from "next/image"
import Link from "next/link"
import { X, RefreshCw, UserPlus, ChevronRight, Sparkles } from "lucide-react"
import { Id } from "@/lib/api"
import { createLogger } from "@/lib/logger"
import {
  useDismissGraphSuggestion,
  useGraphFollowMutation,
  useGraphSuggestions,
  useRefreshGraphSuggestions,
} from "@/hooks/useGraphSuggestions"

const log = createLogger("SuggestedUsers")

interface SuggestedUsersProps {
  /** Max suggestions to show in the widget (default 5) */
  limit?: number
  /** Whether to show the "See all" link */
  showSeeAll?: boolean
}

export function SuggestedUsers({ limit = 5, showSeeAll = true }: SuggestedUsersProps) {
  const { isSignedIn } = useUser()
  const isAuthenticated = isSignedIn ?? false

  const {
    data: suggestions,
    isLoading: suggestionsLoading,
  } = useGraphSuggestions(limit, isAuthenticated)
  const dismissSuggestion = useDismissGraphSuggestion(limit)
  const graphFollowUser = useGraphFollowMutation(limit)
  const refreshSuggestions = useRefreshGraphSuggestions(limit)

  // Keep the primary follow relation in sync while graph suggestions are used.
  const followUser = useMutation(api.follows.followUser)

  const [loadingFollow, setLoadingFollow] = useState<Set<string>>(new Set())
  const [dismissing, setDismissing] = useState<Set<string>>(new Set())
  const [isRefreshing, setIsRefreshing] = useState(false)

  const handleFollow = useCallback(
    async (
      params: {
        suggestionId: string
        targetClerkId: string
        profileUserId?: string | null
      }
    ) => {
      setLoadingFollow((prev) => new Set(prev).add(params.suggestionId))
      try {
        await graphFollowUser.mutateAsync({
          targetClerkId: params.targetClerkId,
          action: "follow",
        })

        if (params.profileUserId) {
          await followUser({ userId: params.profileUserId as Id<"users"> })
        }

        // Auto-dismiss after following
        await dismissSuggestion.mutateAsync(params.targetClerkId)
      } catch (err) {
        log.error("Failed to follow user", err)
      } finally {
        setLoadingFollow((prev) => {
          const next = new Set(prev)
          next.delete(params.suggestionId)
          return next
        })
      }
    },
    [dismissSuggestion, followUser, graphFollowUser]
  )

  const handleDismiss = useCallback(
    async (params: { suggestionId: string; targetClerkId: string }) => {
      setDismissing((prev) => new Set(prev).add(params.suggestionId))
      try {
        await dismissSuggestion.mutateAsync(params.targetClerkId)
      } catch (err) {
        log.error("Failed to dismiss suggestion", err)
      } finally {
        setDismissing((prev) => {
          const next = new Set(prev)
          next.delete(params.suggestionId)
          return next
        })
      }
    },
    [dismissSuggestion]
  )

  const handleRefresh = useCallback(async () => {
    setIsRefreshing(true)
    try {
      await refreshSuggestions.mutateAsync()
    } catch (err) {
      log.error("Failed to refresh suggestions", err)
    } finally {
      setIsRefreshing(false)
    }
  }, [refreshSuggestions])

  // Loading skeleton
  if (suggestionsLoading || suggestions === undefined || suggestions === null) {
    return (
      <div className="rounded-lg border border-border bg-card p-4">
        <div className="flex items-center justify-between mb-3">
          <div className="h-5 w-40 rounded bg-muted bg-muted animate-pulse" />
          <div className="h-5 w-5 rounded bg-muted bg-muted animate-pulse" />
        </div>
        <div className="space-y-3">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-muted bg-muted animate-pulse" />
              <div className="flex-1 space-y-1">
                <div className="h-4 w-24 rounded bg-muted bg-muted animate-pulse" />
                <div className="h-3 w-32 rounded bg-muted bg-muted animate-pulse" />
              </div>
              <div className="h-8 w-16 rounded bg-muted bg-muted animate-pulse" />
            </div>
          ))}
        </div>
      </div>
    )
  }

  // Empty state
  if (suggestions.length === 0) {
    return (
      <div className="rounded-lg border border-border bg-card p-4">
        <div className="flex items-center justify-between mb-3">
          <h3 className="flex items-center gap-2 text-sm font-semibold text-foreground">
            <Sparkles className="h-4 w-4 text-yellow-500" />
            Suggested for you
          </h3>
          <button
            onClick={handleRefresh}
            disabled={isRefreshing}
            className="rounded p-1 text-muted-foreground hover:text-muted-foreground dark:hover:text-muted-foreground transition-colors disabled:opacity-50"
            title="Refresh suggestions"
          >
            <RefreshCw className={`h-4 w-4 ${isRefreshing ? "animate-spin" : ""}`} />
          </button>
        </div>
        <p className="text-sm text-muted-foreground text-center py-4">
          No suggestions yet. Follow some users and check back later!
        </p>
      </div>
    )
  }

  return (
    <div className="rounded-lg border border-border bg-card p-4">
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <h3 className="flex items-center gap-2 text-sm font-semibold text-foreground">
          <Sparkles className="h-4 w-4 text-yellow-500" />
          Suggested for you
        </h3>
        <button
          onClick={handleRefresh}
          disabled={isRefreshing}
          className="rounded p-1 text-muted-foreground hover:text-muted-foreground dark:hover:text-muted-foreground transition-colors disabled:opacity-50"
          title="Refresh suggestions"
        >
          <RefreshCw className={`h-4 w-4 ${isRefreshing ? "animate-spin" : ""}`} />
        </button>
      </div>

      {/* Suggestion list */}
      <div className="space-y-3">
        {suggestions.map((suggestion) => {
          const user = suggestion.user!
          const isFollowing = loadingFollow.has(suggestion._id)
          const isDismissingThis = dismissing.has(suggestion._id)
          const displayName = user.name ?? user.username ?? "User"
          const profileUserId = user.appUserId
          const profileHref = profileUserId ? `/profile/${profileUserId}` : "/profile/me"

          return (
            <div
              key={suggestion._id}
              className={`group relative flex items-start gap-3 transition-opacity ${
                isDismissingThis ? "opacity-50" : ""
              }`}
            >
              {/* Avatar */}
              <Link href={profileHref} className="flex-shrink-0">
                <div className="relative h-10 w-10">
                  {user.profilePicture ? (
                    <Image
                      src={user.profilePicture}
                      alt={displayName}
                      fill
                      sizes="40px"
                      className="rounded-full object-cover"
                    />
                  ) : (
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary text-sm font-bold text-primary-foreground">
                      {displayName.charAt(0).toUpperCase()}
                    </div>
                  )}
                </div>
              </Link>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <Link
                  href={profileHref}
                  className="text-sm font-medium text-foreground hover:underline truncate block"
                >
                  {displayName}
                </Link>

                {/* Reasons tooltip */}
                <div className="mt-0.5" title={suggestion.reasons.join(", ")}>
                  <p className="text-xs text-muted-foreground truncate">
                    {suggestion.reasons[0]}
                    {suggestion.reasons.length > 1 &&
                      ` +${suggestion.reasons.length - 1} more`}
                  </p>
                </div>

                {/* Follow button */}
                <button
                  onClick={() =>
                    handleFollow({
                      suggestionId: suggestion._id,
                      targetClerkId: user.clerkId,
                      profileUserId,
                    })
                  }
                  disabled={isFollowing}
                  className="mt-1.5 inline-flex items-center gap-1 rounded-full bg-primary px-3 py-1 text-xs font-medium text-primary-foreground hover:bg-primary/90 transition-colors disabled:opacity-50"
                >
                  <UserPlus className="h-3 w-3" />
                  {isFollowing ? "Following..." : "Follow"}
                </button>
              </div>

              {/* Dismiss button */}
              <button
                onClick={() =>
                  handleDismiss({
                    suggestionId: suggestion._id,
                    targetClerkId: user.clerkId,
                  })
                }
                disabled={isDismissingThis}
                className="flex-shrink-0 rounded p-1 text-muted-foreground opacity-0 group-hover:opacity-100 hover:text-muted-foreground dark:hover:text-muted-foreground transition-all"
                title="Dismiss suggestion"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          )
        })}
      </div>

      {/* See all link */}
      {showSeeAll && (
        <Link
          href="/discover/suggested"
          className="mt-3 flex items-center justify-center gap-1 rounded-lg py-2 text-xs font-medium text-primary hover:bg-primary/10 hover:bg-primary/10 transition-colors"
        >
          See all suggestions
          <ChevronRight className="h-3 w-3" />
        </Link>
      )}
    </div>
  )
}
