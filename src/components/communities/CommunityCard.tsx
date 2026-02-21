"use client"

import Link from "next/link"
import { useMutation, useQuery } from "convex/react"
import { api } from "@/convex/_generated/api"
import { Id } from "@/convex/_generated/dataModel"
import { Users, Lock, EyeOff, Globe } from "lucide-react"
import { useState } from "react"

interface Community {
  _id: Id<"communities">
  name: string
  slug: string
  description: string
  avatar?: string
  type: "public" | "private" | "secret"
  category: string
  memberCount: number
  viewerRole: string | null
}

interface CommunityCardProps {
  community: Community
  showJoinButton?: boolean
}

const TYPE_ICONS = {
  public: Globe,
  private: Lock,
  secret: EyeOff,
}

const TYPE_LABELS = {
  public: "Public",
  private: "Private",
  secret: "Secret",
}

const CATEGORY_COLORS: Record<string, string> = {
  Academic: "bg-primary/10 text-primary dark:bg-blue-900 dark:text-blue-300",
  Research: "bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-300",
  Social: "bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300",
  Sports: "bg-orange-100 text-orange-700 dark:bg-orange-900 dark:text-orange-300",
  Clubs: "bg-pink-100 text-pink-700 dark:bg-pink-900 dark:text-pink-300",
  Technology: "bg-cyan-100 text-cyan-700 dark:bg-cyan-900 dark:text-cyan-300",
  Arts: "bg-rose-100 text-rose-700 dark:bg-rose-900 dark:text-rose-300",
  Other: "bg-muted text-foreground bg-muted text-muted-foreground",
}

export function CommunityCard({
  community,
  showJoinButton = true,
}: CommunityCardProps) {
  const joinCommunity = useMutation(api.communities.joinCommunity)
  const leaveCommunity = useMutation(api.communities.leaveCommunity)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const TypeIcon = TYPE_ICONS[community.type]
  const isMember =
    community.viewerRole &&
    community.viewerRole !== "pending"
  const isPending = community.viewerRole === "pending"

  const handleJoin = async (e: React.MouseEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)
    try {
      await joinCommunity({ communityId: community._id })
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to join community")
    } finally {
      setIsLoading(false)
    }
  }

  const handleLeave = async (e: React.MouseEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)
    try {
      await leaveCommunity({ communityId: community._id })
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to leave community")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Link href={`/c/${community.slug}`} className="block">
      <div className="group flex flex-col rounded-xl border border-border bg-card p-4 shadow-sm transition hover:border-primary/50 hover:shadow border-border bg-card dark:hover:border-blue-600">
        {/* Avatar + Name Row */}
        <div className="flex items-start gap-3">
          <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-blue-400 to-purple-500 text-xl font-bold text-primary-foreground select-none">
            {community.avatar ? (
              <img
                src={community.avatar}
                alt={community.name}
                className="h-12 w-12 rounded-full object-cover"
              />
            ) : (
              community.name.charAt(0).toUpperCase()
            )}
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="truncate font-semibold text-foreground group-hover:text-primary text-foreground dark:group-hover:text-primary">
              {community.name}
            </h3>
            <div className="mt-0.5 flex flex-wrap items-center gap-1.5">
              <span
                className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${
                  CATEGORY_COLORS[community.category] ?? CATEGORY_COLORS.Other
                }`}
              >
                {community.category}
              </span>
              <span className="inline-flex items-center gap-0.5 text-xs text-muted-foreground">
                <TypeIcon className="h-3 w-3" />
                {TYPE_LABELS[community.type]}
              </span>
            </div>
          </div>
        </div>

        {/* Description */}
        <p className="mt-3 line-clamp-2 text-sm text-muted-foreground">
          {community.description}
        </p>

        {/* Footer */}
        <div className="mt-3 flex items-center justify-between">
          <span className="flex items-center gap-1 text-sm text-muted-foreground">
            <Users className="h-3.5 w-3.5" />
            {community.memberCount.toLocaleString()} member
            {community.memberCount !== 1 ? "s" : ""}
          </span>

          {showJoinButton && (
            <div onClick={(e) => e.stopPropagation()}>
              {isMember ? (
                <button
                  onClick={handleLeave}
                  disabled={isLoading}
                  className="rounded-full border border-border px-3 py-1 text-xs font-medium text-muted-foreground hover:border-red-400 hover:text-destructive disabled:opacity-50 transition-colors border-border text-muted-foreground"
                >
                  {isLoading ? "..." : "Leave"}
                </button>
              ) : isPending ? (
                <span className="rounded-full bg-yellow-100 px-3 py-1 text-xs font-medium text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300">
                  Pending
                </span>
              ) : (
                <button
                  onClick={handleJoin}
                  disabled={isLoading}
                  className="rounded-full bg-primary px-3 py-1 text-xs font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50 transition-colors"
                >
                  {isLoading
                    ? "..."
                    : community.type === "private"
                      ? "Request"
                      : "Join"}
                </button>
              )}
            </div>
          )}
        </div>

        {error && (
          <p className="mt-1 text-xs text-destructive">{error}</p>
        )}
      </div>
    </Link>
  )
}
