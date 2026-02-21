"use client"

import { useQuery } from "convex/react"
import { api } from "@/convex/_generated/api"
import { Id } from "@/../convex/_generated/dataModel"

type StatusType = "online" | "away" | "dnd" | "invisible" | "offline" | null

interface OnlineStatusDotProps {
  userId?: Id<"users">
  /** Directly pass status instead of fetching */
  status?: StatusType
  /** Size variant */
  size?: "sm" | "md" | "lg"
  /** Show as overlay on an avatar (absolute positioning) */
  overlay?: boolean
  /** Show last seen text */
  showLastSeen?: boolean
  /** Custom class name */
  className?: string
}

const statusColors: Record<string, string> = {
  online: "bg-success",
  away: "bg-yellow-500",
  dnd: "bg-destructive",
  invisible: "bg-muted",
  offline: "bg-muted",
}

const statusLabels: Record<string, string> = {
  online: "Online",
  away: "Away",
  dnd: "Do Not Disturb",
  invisible: "Invisible",
  offline: "Offline",
}

const sizeClasses = {
  sm: "h-2 w-2",
  md: "h-3 w-3",
  lg: "h-4 w-4",
}

const overlayPositions = {
  sm: "-bottom-0 -right-0",
  md: "-bottom-0.5 -right-0.5",
  lg: "-bottom-1 -right-1",
}

/**
 * Format "last seen" relative time
 */
function formatLastSeen(timestamp: number | null | undefined): string {
  if (!timestamp) return ""

  const now = Date.now()
  const diff = now - timestamp

  const minutes = Math.floor(diff / 60000)
  const hours = Math.floor(diff / 3600000)
  const days = Math.floor(diff / 86400000)

  if (minutes < 1) return "Just now"
  if (minutes < 60) return `${minutes}m ago`
  if (hours < 24) return `${hours}h ago`
  if (days < 7) return `${days}d ago`

  return new Date(timestamp).toLocaleDateString()
}

/**
 * OnlineStatusDot
 * Reusable indicator showing a user's online/presence status.
 * Can fetch status from API via userId or accept it directly via props.
 */
export function OnlineStatusDot({
  userId,
  status: directStatus,
  size = "md",
  overlay = false,
  showLastSeen = false,
  className = "",
}: OnlineStatusDotProps) {
  // Fetch presence from API if userId is provided and no direct status
  const presence = useQuery(
    api.presence.getUserPresence,
    userId && !directStatus ? { userId } : "skip"
  )

  const resolvedStatus = directStatus || presence?.status || "offline"
  const lastSeenAt = presence?.lastSeenAt
  const isVisible = presence?.showOnlineStatus !== false || directStatus

  // Don't render if user has hidden their online status (and we don't have a direct override)
  if (!directStatus && presence && !presence.showOnlineStatus) {
    return null
  }

  const colorClass = statusColors[resolvedStatus] || statusColors.offline
  const sizeClass = sizeClasses[size]
  const label = statusLabels[resolvedStatus] || "Offline"

  if (showLastSeen && resolvedStatus === "offline" && lastSeenAt) {
    return (
      <span className={`text-xs text-muted-foreground ${className}`}>
        Last seen {formatLastSeen(lastSeenAt)}
      </span>
    )
  }

  const dot = (
    <span
      className={`
        inline-block rounded-full border-2 border-card
        ${colorClass} ${sizeClass}
        ${resolvedStatus === "online" ? "animate-pulse" : ""}
        ${overlay ? `absolute ${overlayPositions[size]}` : ""}
        ${className}
      `}
      title={label}
      aria-label={label}
    />
  )

  return dot
}

/**
 * Wrapper to position a status dot on an avatar
 */
export function AvatarWithStatus({
  userId,
  status,
  size = "md",
  children,
  className = "",
}: {
  userId?: Id<"users">
  status?: StatusType
  size?: "sm" | "md" | "lg"
  children: React.ReactNode
  className?: string
}) {
  return (
    <div className={`relative inline-block ${className}`}>
      {children}
      <OnlineStatusDot
        userId={userId}
        status={status}
        size={size}
        overlay
      />
    </div>
  )
}

export { formatLastSeen }
export type { StatusType }
