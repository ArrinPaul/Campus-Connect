"use client"

import { useCallback, useState } from "react"
import { useQuery, useMutation, useConvexAuth } from "convex/react"
import { useUser } from "@clerk/nextjs"
import { api } from "@/convex/_generated/api"
import Image from "next/image"
import Link from "next/link"
import { RefreshCw, UserPlus, X, ArrowLeft, Sparkles } from "lucide-react"
import { Id } from "@/convex/_generated/dataModel"
import { createLogger } from "@/lib/logger"

const log = createLogger("discover/suggested")

export default function SuggestedUsersPage() {
  const { isLoaded, isSignedIn } = useUser()
  const { isAuthenticated } = useConvexAuth()
  const suggestions = useQuery(
    api.suggestions.getSuggestions,
    isAuthenticated ? { limit: 20 } : "skip"
  )
  const dismissSuggestion = useMutation(api.suggestions.dismissSuggestion)
  const followUser = useMutation(api.follows.followUser)
  const refreshSuggestions = useMutation(api.suggestions.refreshSuggestions)

  const [loadingFollow, setLoadingFollow] = useState<Set<string>>(new Set())
  const [dismissing, setDismissing] = useState<Set<string>>(new Set())
  const [isRefreshing, setIsRefreshing] = useState(false)

  const handleFollow = useCallback(
    async (userId: Id<"users">, suggestionId: Id<"suggestions">) => {
      setLoadingFollow((prev) => new Set(prev).add(suggestionId as string))
      try {
        await followUser({ userId })
        await dismissSuggestion({ suggestionId })
      } catch (err) {
        log.error("Failed to follow user", err)
      } finally {
        setLoadingFollow((prev) => {
          const next = new Set(prev)
          next.delete(suggestionId as string)
          return next
        })
      }
    },
    [followUser, dismissSuggestion]
  )

  const handleDismiss = useCallback(
    async (suggestionId: Id<"suggestions">) => {
      setDismissing((prev) => new Set(prev).add(suggestionId as string))
      try {
        await dismissSuggestion({ suggestionId })
      } catch (err) {
        log.error("Failed to dismiss suggestion", err)
      } finally {
        setDismissing((prev) => {
          const next = new Set(prev)
          next.delete(suggestionId as string)
          return next
        })
      }
    },
    [dismissSuggestion]
  )

  const handleRefresh = useCallback(async () => {
    setIsRefreshing(true)
    try {
      await refreshSuggestions({})
    } catch (err) {
      log.error("Failed to refresh suggestions", err)
    } finally {
      setIsRefreshing(false)
    }
  }, [refreshSuggestions])

  // Auth loading
  if (!isLoaded) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-border border-t-primary" />
      </div>
    )
  }

  if (!isSignedIn) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-foreground">
            Not Authenticated
          </h2>
          <p className="mt-2 text-muted-foreground">
            Please sign in to see suggestions.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-4 sm:px-6 sm:py-8">
      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link
            href="/discover"
            className="rounded-lg p-2 text-muted-foreground hover:bg-accent transition-colors"
          >
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <div>
            <h1 className="flex items-center gap-2 text-xl font-bold text-foreground sm:text-2xl">
              <Sparkles className="h-5 w-5 text-warning" />
              Suggested for You
            </h1>
            <p className="mt-0.5 text-sm text-muted-foreground">
              People you may want to connect with
            </p>
          </div>
        </div>

        <button
          onClick={handleRefresh}
          disabled={isRefreshing}
          className="inline-flex items-center gap-2 rounded-lg border border-border px-3 py-2 text-sm font-medium text-foreground hover:bg-accent transition-colors disabled:opacity-50"
        >
          <RefreshCw
            className={`h-4 w-4 ${isRefreshing ? "animate-spin" : ""}`}
          />
          Refresh
        </button>
      </div>

      {/* Content */}
      {suggestions === undefined ? (
        // Loading skeletons
        <div className="space-y-4">
          {[...Array(6)].map((_, i) => (
            <div
              key={i}
              className="flex items-start gap-4 rounded-lg border border-border bg-card p-4 animate-pulse"
            >
              <div className="h-12 w-12 rounded-full bg-muted bg-muted" />
              <div className="flex-1 space-y-2">
                <div className="h-4 w-32 rounded bg-muted bg-muted" />
                <div className="h-3 w-48 rounded bg-muted bg-muted" />
                <div className="flex gap-2">
                  <div className="h-6 w-16 rounded-full bg-muted bg-muted" />
                  <div className="h-6 w-20 rounded-full bg-muted bg-muted" />
                </div>
              </div>
              <div className="h-8 w-20 rounded bg-muted bg-muted" />
            </div>
          ))}
        </div>
      ) : suggestions.length === 0 ? (
        // Empty state
        <div className="rounded-lg border border-border bg-card p-12 text-center">
          <Sparkles className="mx-auto h-12 w-12 text-muted-foreground" />
          <h3 className="mt-4 text-lg font-medium text-foreground">
            No suggestions yet
          </h3>
          <p className="mt-2 text-sm text-muted-foreground">
            Follow some users, add skills to your profile, and check back later
            for personalized suggestions.
          </p>
          <button
            onClick={handleRefresh}
            disabled={isRefreshing}
            className="mt-4 inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors disabled:opacity-50"
          >
            <RefreshCw
              className={`h-4 w-4 ${isRefreshing ? "animate-spin" : ""}`}
            />
            Generate Suggestions
          </button>
        </div>
      ) : (
        // Suggestion cards
        <div className="space-y-3">
          {suggestions.map((suggestion) => {
            const user = suggestion.user!
            const isFollowingUser = loadingFollow.has(suggestion._id as string)
            const isDismissingThis = dismissing.has(suggestion._id as string)

            return (
              <div
                key={suggestion._id}
                className={`group relative flex items-start gap-4 rounded-lg border border-border bg-card p-4 transition-all hover:shadow-md dark:hover:shadow-gray-900/50 ${
                  isDismissingThis ? "opacity-50 scale-95" : ""
                }`}
              >
                {/* Avatar */}
                <Link
                  href={`/profile/${user._id}`}
                  className="flex-shrink-0"
                >
                  <div className="relative h-12 w-12">
                    {user.profilePicture ? (
                      <Image
                        src={user.profilePicture}
                        alt={user.name}
                        fill
                        sizes="48px"
                        className="rounded-full object-cover"
                      />
                    ) : (
                      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary text-lg font-bold text-primary-foreground">
                        {user.name.charAt(0).toUpperCase()}
                      </div>
                    )}
                  </div>
                </Link>

                {/* User info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <Link
                      href={`/profile/${user._id}`}
                      className="text-sm font-semibold text-foreground hover:underline truncate sm:text-base"
                    >
                      {user.name}
                    </Link>
                    {user.username && (
                      <span className="text-xs text-muted-foreground hidden sm:inline">
                        @{user.username}
                      </span>
                    )}
                  </div>

                  {/* Role & university */}
                  <div className="mt-0.5 flex flex-wrap items-center gap-2">
                    <span className="text-xs rounded-full bg-primary/10 dark:bg-blue-900 px-2 py-0.5 font-medium text-blue-800 dark:text-blue-200">
                      {user.role}
                    </span>
                    {user.university && (
                      <span className="text-xs text-muted-foreground truncate">
                        {user.university}
                      </span>
                    )}
                  </div>

                  {/* Why suggested (reasons) */}
                  <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
                    {suggestion.reasons.map((reason, i) => (
                      <span
                        key={i}
                        className="inline-flex items-center gap-1 text-xs rounded-full bg-yellow-50 dark:bg-yellow-900/20 px-2 py-0.5 text-yellow-700 dark:text-yellow-300 border border-yellow-200 dark:border-yellow-800"
                      >
                        <Sparkles className="h-3 w-3" />
                        {reason}
                      </span>
                    ))}
                  </div>

                  {/* Skills */}
                  {user.skills.length > 0 && (
                    <div className="mt-2 flex flex-wrap gap-1">
                      {user.skills.slice(0, 4).map((skill) => (
                        <span
                          key={skill}
                          className="text-xs rounded-full bg-muted px-2 py-0.5 text-foreground"
                        >
                          {skill}
                        </span>
                      ))}
                      {user.skills.length > 4 && (
                        <span className="text-xs text-muted-foreground">
                          +{user.skills.length - 4} more
                        </span>
                      )}
                    </div>
                  )}
                </div>

                {/* Actions */}
                <div className="flex flex-col items-end gap-2 flex-shrink-0">
                  <button
                    onClick={() => handleDismiss(suggestion._id)}
                    disabled={isDismissingThis}
                    className="rounded p-1 text-muted-foreground opacity-0 group-hover:opacity-100 hover:text-foreground transition-all"
                    title="Dismiss suggestion"
                  >
                    <X className="h-4 w-4" />
                  </button>

                  <button
                    onClick={() => handleFollow(user._id, suggestion._id)}
                    disabled={isFollowingUser}
                    className="inline-flex items-center gap-1.5 rounded-full bg-primary px-4 py-1.5 text-xs font-medium text-primary-foreground hover:bg-primary/90 transition-colors disabled:opacity-50 sm:text-sm"
                  >
                    <UserPlus className="h-3.5 w-3.5" />
                    {isFollowingUser ? "Following..." : "Follow"}
                  </button>

                  {/* Score for debugging — hidden in production */}
                  <span className="text-[10px] text-muted-foreground">
                    Score: {(suggestion.score * 100).toFixed(0)}%
                  </span>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
