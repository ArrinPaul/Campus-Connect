"use client"

import { useState } from "react"
import { useMutation, useQuery } from "@/lib/api"
import { api } from "@/lib/api"
import { createLogger } from "@/lib/logger"
import { toast } from "sonner"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { motion } from "framer-motion"
import { Heart } from "lucide-react"

const log = createLogger("ReactionPicker")

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

export interface LikeButtonProps {
  targetId: string
  targetType: "post" | "comment"
  onReactionAdded?: () => void
  compact?: boolean
}

export function LikeButton({
  targetId,
  targetType,
  onReactionAdded,
  compact = false,
}: LikeButtonProps) {
  const addReaction = useMutation(api.reactions.addReaction)
  const removeReaction = useMutation(api.reactions.removeReaction)

  const userReactionData = useQuery(
    api.reactions.getUserReaction,
    targetId ? { targetId, targetType } : "skip"
  )
  const reactions = useQuery(
    api.reactions.getReactions,
    targetId ? { targetId, targetType } : "skip"
  )

  const [optimisticLiked, setOptimisticLiked] = useState<boolean | null>(null)
  const [optimisticCountDelta, setOptimisticCountDelta] = useState<number>(0)

  const reactionValue =
    typeof userReactionData === "object" && userReactionData !== null
      ? (userReactionData as any).reaction
      : userReactionData
  const serverLiked = Boolean(reactionValue)
  const isLiked = optimisticLiked !== null ? optimisticLiked : serverLiked

  const serverTotal = reactions?.counts?.total ?? reactions?.total ?? 0
  const totalReactions = Math.max(0, serverTotal + optimisticCountDelta)

  const handleToggleLike = async () => {
    const nextLikedState = !isLiked
    setOptimisticLiked(nextLikedState)
    setOptimisticCountDelta((prev) => prev + (nextLikedState ? 1 : -1))

    try {
      if (isLiked) {
        await removeReaction({ targetId, targetType })
      } else {
        await addReaction({ targetId, targetType, type: "like" })
      }
      onReactionAdded?.()
    } catch (error) {
      log.error("Failed to toggle like", error)
      toast.error("Failed to update like")
      // Revert optimistic changes
      setOptimisticLiked(isLiked)
      setOptimisticCountDelta((prev) => prev + (isLiked ? 1 : -1))
    }
  }

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <motion.button
            whileTap={{ scale: 0.85 }}
            whileHover={{ scale: 1.05 }}
            onClick={handleToggleLike}
            className={`flex items-center gap-1.5 rounded-full px-3 py-1.5 transition-all ${
              isLiked
                ? "bg-rose-500/10 text-rose-500"
                : "text-slate hover:bg-rose-500/10 hover:text-rose-500"
            } ${compact ? "px-2 py-1 text-sm" : ""}`}
            aria-label={isLiked ? "Unlike" : "Like"}
          >
            <Heart
              className={`h-[18px] w-[18px] transition-transform ${
                isLiked ? "fill-rose-500 text-rose-500 scale-110" : ""
              }`}
            />
            {totalReactions > 0 && (
              <span className={`text-xs font-semibold ${isLiked ? "text-rose-500" : "text-slate"}`}>
                {totalReactions}
              </span>
            )}
          </motion.button>
        </TooltipTrigger>
        <TooltipContent>
          {isLiked ? "Unlike" : "Like"}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  )
}

// Alias for backward compatibility
export const ReactionPicker = LikeButton

// Reaction Summary Display
interface ReactionSummaryProps {
  targetId: string
  targetType: "post" | "comment"
  onClick?: () => void
}

export function ReactionSummary({ targetId, targetType, onClick }: ReactionSummaryProps) {
  const reactions = useQuery(
    api.reactions.getReactions,
    targetId ? { targetId, targetType } : "skip"
  )

  const total = reactions?.counts?.total ?? reactions?.total ?? 0

  if (!total) {
    return null
  }

  return (
    <button
      onClick={onClick}
      className="flex items-center gap-1 text-xs text-slate hover:text-ink-deep transition-colors"
    >
      <Heart className="h-3.5 w-3.5 fill-rose-500 text-rose-500 inline" />
      <span>{total}</span>
    </button>
  )
}
