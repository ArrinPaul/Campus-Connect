"use client"

import { useState } from "react"
import { useMutation, useQuery } from "convex/react"
import { api } from "@/convex/_generated/api"
import { Id } from "@/convex/_generated/dataModel"
import { createLogger } from "@/lib/logger"
import { toast } from "sonner"

const log = createLogger("ReactionPicker")
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"

export type ReactionType = "like" | "love" | "laugh" | "wow" | "sad" | "scholarly"

export const reactionEmojis: Record<ReactionType, string> = {
  like: "👍",
  love: "❤️",
  laugh: "😂",
  wow: "😮",
  sad: "😢",
  scholarly: "🎓",
}

export const reactionLabels: Record<ReactionType, string> = {
  like: "Like",
  love: "Love",
  laugh: "Laugh",
  wow: "Wow",
  sad: "Sad",
  scholarly: "Scholarly",
}

interface ReactionPickerProps {
  targetId: string
  targetType: "post" | "comment"
  onReactionAdded?: () => void
  compact?: boolean
}

export function ReactionPicker({
  targetId,
  targetType,
  onReactionAdded,
  compact = false,
}: ReactionPickerProps) {
  const [showPicker, setShowPicker] = useState(false)
  const [isHovering, setIsHovering] = useState(false)

  const addReaction = useMutation(api.reactions.addReaction)
  const removeReaction = useMutation(api.reactions.removeReaction)
  const userReaction = useQuery(api.reactions.getUserReaction, {
    targetId,
    targetType,
  })
  const reactions = useQuery(api.reactions.getReactions, {
    targetId,
    targetType,
  })

  const handleReaction = async (type: ReactionType) => {
    try {
      if (userReaction === type) {
        // Remove reaction if clicking same type
        await removeReaction({ targetId, targetType })
      } else {
        // Add or change reaction
        await addReaction({ targetId, targetType, type })
      }
      setShowPicker(false)
      onReactionAdded?.()
    } catch (error) {
      log.error("Failed to react", error)
      toast.error("Failed to react")
    }
  }

  const handleMouseEnter = () => {
    setIsHovering(true)
    // Only show picker on hover for desktop (not on mobile)
    if (window.innerWidth >= 768) {
      setShowPicker(true)
    }
  }

  const handleMouseLeave = () => {
    setIsHovering(false)
    // Delay hiding to allow moving onto the picker
    setTimeout(() => {
      if (!isHovering) {
        setShowPicker(false)
      }
    }, 200)
  }

  const handleClick = () => {
    // On mobile or when clicking, toggle picker
    if (window.innerWidth < 768 || !showPicker) {
      setShowPicker(!showPicker)
    } else if (userReaction) {
      // If already reacted and picker is showing, remove reaction
      handleReaction(userReaction as ReactionType)
    }
  }

  // Show reaction summary
  const displayReactions = reactions?.topReactions || []
  const totalReactions = reactions?.total || 0

  return (
    <div className="relative inline-block">
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <button
              onClick={handleClick}
              onMouseEnter={handleMouseEnter}
              onMouseLeave={handleMouseLeave}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full transition-all hover:bg-accent ${
                userReaction
                  ? "bg-primary/10 dark:bg-blue-900/30 text-primary"
                  : "text-muted-foreground hover:text-foreground"
              } ${compact ? "px-2 py-1 text-sm" : ""}`}
              aria-label={userReaction ? `You reacted with ${reactionLabels[userReaction as ReactionType]}` : "React to this post"}
            >
              {userReaction ? (
                <span className="text-lg">{reactionEmojis[userReaction as ReactionType]}</span>
              ) : (
                <span className="text-lg">👍</span>
              )}
              {totalReactions > 0 && (
                <span className="text-sm font-medium">{totalReactions}</span>
              )}
            </button>
          </TooltipTrigger>
          <TooltipContent>
            {userReaction
              ? `You reacted with ${reactionLabels[userReaction as ReactionType]}`
              : "React to this"}
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>

      {/* Reaction Picker Popup */}
      {showPicker && (
        <div
          className="absolute bottom-full left-0 mb-2 z-50 animate-in fade-in slide-in-from-bottom-2"
          onMouseEnter={() => setIsHovering(true)}
          onMouseLeave={handleMouseLeave}
        >
          <div className="bg-background border border-border rounded-full shadow-lg p-2 flex gap-1">
            {(Object.keys(reactionEmojis) as ReactionType[]).map((type) => (
              <button
                key={type}
                onClick={() => handleReaction(type)}
                className={`w-10 h-10 flex items-center justify-center rounded-full text-2xl transition-all hover:scale-125 hover:bg-accent ${
                  userReaction === type ? "scale-110 bg-accent" : ""
                }`}
                title={reactionLabels[type]}
                aria-label={`React with ${reactionLabels[type]}`}
              >
                {reactionEmojis[type]}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

// Reaction Summary Display (shows who reacted)
interface ReactionSummaryProps {
  targetId: string
  targetType: "post" | "comment"
  onClick?: () => void
}

export function ReactionSummary({ targetId, targetType, onClick }: ReactionSummaryProps) {
  const reactions = useQuery(api.reactions.getReactions, {
    targetId,
    targetType,
  })

  if (!reactions || reactions.total === 0) {
    return null
  }

  const { topReactions, total } = reactions

  return (
    <button
      onClick={onClick}
      className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors"
    >
      <div className="flex -space-x-1">
        {topReactions.map(({ type }) => (
          <span
            key={type}
            className="inline-flex items-center justify-center w-5 h-5 text-xs bg-background border border-border rounded-full"
          >
            {reactionEmojis[type]}
          </span>
        ))}
      </div>
      <span>{total}</span>
    </button>
  )
}
