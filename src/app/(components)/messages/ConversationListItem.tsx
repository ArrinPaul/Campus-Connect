"use client"

import { OptimizedImage } from "@/components/ui/OptimizedImage"
import { OnlineStatusDot } from "@/components/ui/OnlineStatusDot"
import { useUser } from "@/lib/auth/client"
import { Id } from "@/lib/api"
import { formatDistanceToNow } from "date-fns"
import { cn } from "@/lib/utils"

interface ConversationListItemProps {
  conversation: {
    _id: Id<"conversations">
    lastMessage?: string
    updatedAt: number
    otherUser: {
      _id: Id<"users">
      name: string
      profilePicture?: string
    }
    unreadCount?: number
  }
  isSelected: boolean
  onClick: () => void
}

export function ConversationListItem({
  conversation,
  isSelected,
  onClick,
}: ConversationListItemProps) {
  const { user: currentUser } = useUser()
  const otherUser = conversation.otherUser

  return (
    <button
      onClick={onClick}
      className={cn(
        "w-full px-4 py-4 text-left transition-all btn-press border-b border-border relative flex items-center gap-4 group",
        isSelected ? "bg-card-parchment" : "bg-card hover:bg-card-parchment/30"
      )}
    >
      {/* Selected Indicator Bar */}
      {isSelected && (
        <div className="absolute left-0 top-0 bottom-0 w-[4px] bg-primary rounded-r-full" />
      )}

      {/* Avatar */}
      <div className="relative flex-shrink-0">
        <div className="h-12 w-12 rounded-full overflow-hidden border border-border bg-card-parchment shadow-sm">
          {otherUser.profilePicture ? (
            <OptimizedImage
              src={otherUser.profilePicture}
              alt={otherUser.name}
              width={48}
              height={48}
              isAvatar
              className="h-full w-full object-cover"
            />
          ) : (
            <div className="h-full w-full flex items-center justify-center text-foreground/20 font-bold text-lg">
              {otherUser.name.charAt(0).toUpperCase()}
            </div>
          )}
        </div>
        <OnlineStatusDot
          userId={otherUser._id}
          size="sm"
          overlay
        />
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <div className="flex justify-between items-baseline mb-0.5">
          <h3 className={cn(
            "text-body-strong truncate",
            isSelected ? "text-foreground" : "text-foreground-muted-80"
          )}>
            {otherUser.name}
          </h3>
          <span className="text-[10px] text-foreground-muted-48 font-semibold uppercase tracking-wider">
            {formatDistanceToNow(conversation.updatedAt, { addSuffix: false })}
          </span>
        </div>
        <div className="flex justify-between items-center gap-2">
          <p className={cn(
            "text-caption truncate",
            (conversation.unreadCount ?? 0) > 0 ? "text-foreground font-semibold" : "text-foreground-muted-48"
          )}>
            {conversation.lastMessage || "No messages yet"}
          </p>
          {(conversation.unreadCount ?? 0) > 0 && (
            <div className="h-4 min-w-[16px] px-1 rounded-full bg-primary text-[10px] font-bold text-white flex items-center justify-center shadow-sm">
              {conversation.unreadCount}
            </div>
          )}
        </div>
      </div>
    </button>
  )
}
