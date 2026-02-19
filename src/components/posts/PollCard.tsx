"use client"

import { useQuery, useMutation } from "convex/react"
import { api } from "@/convex/_generated/api"
import type { Id } from "@/convex/_generated/dataModel"
import { CheckCircle2, Clock, BarChart2, Lock } from "lucide-react"
import { useState } from "react"

interface PollCardProps {
  pollId: Id<"polls">
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function formatTimeRemaining(endsAt: number): string {
  const diff = endsAt - Date.now()
  if (diff <= 0) return "Poll ended"
  const hours = Math.floor(diff / 3_600_000)
  const minutes = Math.floor((diff % 3_600_000) / 60_000)
  if (hours >= 48) return `${Math.floor(hours / 24)} days left`
  if (hours >= 1) return `${hours}h ${minutes}m left`
  return `${minutes}m left`
}

function formatVoteCount(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`
  return String(n)
}

// ── Component ─────────────────────────────────────────────────────────────────

export function PollCard({ pollId }: PollCardProps) {
  const poll = useQuery(api.polls.getPollResults, { pollId })
  const userVote = useQuery(api.polls.getUserVote, { pollId })
  const voteMutation = useMutation(api.polls.vote)

  const [optimisticVote, setOptimisticVote] = useState<string | null>(null)
  const [isVoting, setIsVoting] = useState(false)

  if (poll === undefined) {
    // Loading skeleton
    return (
      <div className="rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 p-4 space-y-2 animate-pulse">
        <div className="h-4 w-1/3 rounded bg-gray-200 dark:bg-gray-700" />
        {[1, 2, 3].map((n) => (
          <div key={n} className="h-9 rounded-lg bg-gray-200 dark:bg-gray-700" />
        ))}
        <div className="h-3 w-1/4 rounded bg-gray-200 dark:bg-gray-700" />
      </div>
    )
  }

  if (poll === null) return null

  const isExpired = poll.isExpired
  const currentVote = optimisticVote ?? userVote ?? null
  const hasVoted = currentVote !== null
  const showResults = hasVoted || isExpired

  // Calculate the winning option(s) for styling
  const maxVotes = Math.max(...poll.options.map((o) => o.voteCount), 0)

  async function handleVote(optionId: string) {
    if (isVoting || isExpired) return
    setOptimisticVote(optionId)
    setIsVoting(true)
    try {
      await voteMutation({ pollId, optionId })
    } catch {
      setOptimisticVote(null) // revert on error
    } finally {
      setIsVoting(false)
    }
  }

  return (
    <div className="rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 p-4 space-y-3">
      {/* Header */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-1.5 text-xs font-medium text-gray-500 dark:text-gray-400">
          <BarChart2 className="h-3.5 w-3.5" />
          <span>Poll</span>
          {poll.isAnonymous && (
            <span className="flex items-center gap-0.5 ml-1 text-gray-400 dark:text-gray-500">
              <Lock className="h-3 w-3" />
              Anonymous
            </span>
          )}
        </div>
        {isExpired ? (
          <span className="inline-flex items-center gap-1 rounded-full bg-gray-200 dark:bg-gray-700 px-2 py-0.5 text-xs font-semibold text-gray-600 dark:text-gray-300">
            Final Results
          </span>
        ) : poll.endsAt ? (
          <span className="flex items-center gap-1 text-xs text-gray-400 dark:text-gray-500">
            <Clock className="h-3 w-3" />
            {formatTimeRemaining(poll.endsAt)}
          </span>
        ) : null}
      </div>

      {/* Optional question */}
      {poll.question && (
        <p className="text-sm font-medium text-gray-800 dark:text-gray-100">{poll.question}</p>
      )}

      {/* Options */}
      <div className="space-y-2">
        {poll.options.map((option) => {
          const isSelected = currentVote === option.id
          const isWinner = showResults && option.voteCount === maxVotes && maxVotes > 0
          const percentage =
            showResults && poll.totalVotes > 0
              ? Math.round((option.voteCount / poll.totalVotes) * 100)
              : 0

          if (showResults) {
            return (
              <div
                key={option.id}
                className={`relative overflow-hidden rounded-lg border transition-colors ${
                  isSelected
                    ? "border-blue-400 dark:border-blue-500 bg-blue-50 dark:bg-blue-900/20"
                    : "border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800"
                }`}
              >
                {/* Progress fill */}
                <div
                  className={`absolute inset-y-0 left-0 transition-all duration-500 ${
                    isSelected
                      ? "bg-blue-100 dark:bg-blue-900/40"
                      : "bg-gray-100 dark:bg-gray-700/60"
                  }`}
                  style={{ width: `${percentage}%` }}
                  aria-hidden="true"
                />

                <div className="relative flex items-center justify-between px-3 py-2.5 gap-2">
                  <div className="flex items-center gap-2 min-w-0">
                    {isSelected && (
                      <CheckCircle2 className="h-4 w-4 text-blue-500 dark:text-blue-400 shrink-0" />
                    )}
                    <span
                      className={`text-sm truncate ${
                        isWinner
                          ? "font-semibold text-gray-900 dark:text-gray-50"
                          : "text-gray-700 dark:text-gray-300"
                      }`}
                    >
                      {option.text}
                    </span>
                  </div>
                  <span className="text-xs font-medium text-gray-500 dark:text-gray-400 shrink-0">
                    {percentage}%
                  </span>
                </div>
              </div>
            )
          }

          // Pre-vote: clickable buttons
          return (
            <button
              key={option.id}
              type="button"
              onClick={() => handleVote(option.id)}
              disabled={isVoting}
              className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-3 py-2.5 text-left text-sm text-gray-700 dark:text-gray-300 hover:border-blue-400 dark:hover:border-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20 disabled:opacity-60 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {option.text}
            </button>
          )
        })}
      </div>

      {/* Footer: total votes */}
      <p className="text-xs text-gray-400 dark:text-gray-500">
        {formatVoteCount(poll.totalVotes)} vote{poll.totalVotes !== 1 ? "s" : ""}
        {!showResults && !isExpired && (
          <span className="ml-1">· Vote to see results</span>
        )}
      </p>
    </div>
  )
}
