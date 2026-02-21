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
      <div className="rounded-xl border border-border bg-muted/50 p-4 space-y-2 animate-pulse">
        <div className="h-4 w-1/3 rounded bg-muted" />
        {[1, 2, 3].map((n) => (
          <div key={n} className="h-9 rounded-lg bg-muted" />
        ))}
        <div className="h-3 w-1/4 rounded bg-muted" />
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
    <div className="rounded-xl border border-border bg-muted/50 p-4 space-y-3">
      {/* Header */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
          <BarChart2 className="h-3.5 w-3.5" />
          <span>Poll</span>
          {poll.isAnonymous && (
            <span className="flex items-center gap-0.5 ml-1 text-muted-foreground">
              <Lock className="h-3 w-3" />
              Anonymous
            </span>
          )}
        </div>
        {isExpired ? (
          <span className="inline-flex items-center gap-1 rounded-full bg-muted px-2 py-0.5 text-xs font-semibold text-muted-foreground">
            Final Results
          </span>
        ) : poll.endsAt ? (
          <span className="flex items-center gap-1 text-xs text-muted-foreground">
            <Clock className="h-3 w-3" />
            {formatTimeRemaining(poll.endsAt)}
          </span>
        ) : null}
      </div>

      {/* Optional question */}
      {poll.question && (
        <p className="text-sm font-medium text-foreground">{poll.question}</p>
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
                    ? "border-blue-400 dark:border-blue-500 bg-primary/10 dark:bg-blue-900/20"
                    : "border-border bg-card"
                }`}
              >
                {/* Progress fill */}
                <div
                  className={`absolute inset-y-0 left-0 transition-all duration-500 ${
                    isSelected
                      ? "bg-primary/10 dark:bg-blue-900/40"
                      : "bg-muted/60"
                  }`}
                  style={{ width: `${percentage}%` }}
                  aria-hidden="true"
                />

                <div className="relative flex items-center justify-between px-3 py-2.5 gap-2">
                  <div className="flex items-center gap-2 min-w-0">
                    {isSelected && (
                      <CheckCircle2 className="h-4 w-4 text-primary shrink-0" />
                    )}
                    <span
                      className={`text-sm truncate ${
                        isWinner
                          ? "font-semibold text-foreground dark:text-foreground"
                          : "text-foreground"
                      }`}
                    >
                      {option.text}
                    </span>
                  </div>
                  <span className="text-xs font-medium text-muted-foreground shrink-0">
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
              className="w-full rounded-lg border border-border bg-card px-3 py-2.5 text-left text-sm text-foreground hover:border-primary hover:border-primary hover:bg-primary/10 hover:bg-primary/10 disabled:opacity-60 transition-colors focus:outline-none focus:ring-2 focus:ring-ring"
            >
              {option.text}
            </button>
          )
        })}
      </div>

      {/* Footer: total votes */}
      <p className="text-xs text-muted-foreground">
        {formatVoteCount(poll.totalVotes)} vote{poll.totalVotes !== 1 ? "s" : ""}
        {!showResults && !isExpired && (
          <span className="ml-1">· Vote to see results</span>
        )}
      </p>
    </div>
  )
}
