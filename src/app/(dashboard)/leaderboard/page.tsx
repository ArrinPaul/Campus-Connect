"use client"

import { useState } from "react"
import { useQuery } from "convex/react"
import { api } from "../../../../convex/_generated/api"
import {
  Trophy, Medal, Star, Crown, Search, Users, TrendingUp
} from "lucide-react"
import Link from "next/link"

export default function LeaderboardPage() {
  const [period, setPeriod] = useState<"weekly" | "monthly" | "all">("all")
  const [universityFilter, setUniversityFilter] = useState("")

  const leaderboard = useQuery(api.gamification.getLeaderboard, {
    period,
    university: universityFilter || undefined,
    limit: 50,
  })

  const myReputation = useQuery(api.gamification.getMyReputation)

  const getRankIcon = (rank: number) => {
    if (rank === 1) return <Crown className="w-5 h-5 text-warning" />
    if (rank === 2) return <Medal className="w-5 h-5 text-muted-foreground" />
    if (rank === 3) return <Medal className="w-5 h-5 text-amber-600" />
    return <span className="w-5 h-5 flex items-center justify-center text-sm text-muted-foreground font-bold">#{rank}</span>
  }

  const getLevelColor = (level: number) => {
    if (level >= 10) return "text-purple-600 bg-purple-100"
    if (level >= 7) return "text-destructive bg-red-100"
    if (level >= 5) return "text-orange-600 bg-orange-100"
    if (level >= 3) return "text-primary bg-primary/10"
    return "text-muted-foreground bg-muted"
  }

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Trophy className="w-8 h-8 text-warning" />
            Leaderboard
          </h1>
          <p className="text-muted-foreground mt-1">Top contributors in the community</p>
        </div>
      </div>

      {/* My Stats Card */}
      {myReputation && (
        <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl p-6 text-primary-foreground">
          <div className="flex items-center justify-between mb-3">
            <div>
              <p className="text-blue-100 text-sm">Your Reputation</p>
              <p className="text-3xl font-bold">{myReputation.reputation}</p>
            </div>
            <div className="text-right">
              <p className="text-blue-100 text-sm">Level</p>
              <p className="text-3xl font-bold">{myReputation.level}</p>
            </div>
          </div>

          {/* XP Progress Bar */}
          <div>
            <div className="flex justify-between text-xs text-blue-200 mb-1">
              <span>Level {myReputation.level}</span>
              <span>Level {myReputation.nextLevel} ({myReputation.repForNextLevel} rep)</span>
            </div>
            <div className="w-full bg-blue-800 rounded-full h-2.5">
              <div
                className="bg-yellow-400 h-2.5 rounded-full transition-all"
                style={{ width: `${myReputation.progress}%` }}
              />
            </div>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="bg-card border rounded-xl p-4">
        <div className="flex items-center justify-between">
          <div className="flex gap-1">
            {(["all", "monthly", "weekly"] as const).map((p) => (
              <button
                key={p}
                onClick={() => setPeriod(p)}
                className={`px-3 py-1 text-sm rounded-full border ${
                  period === p
                    ? "bg-yellow-100 text-yellow-700 border-yellow-300"
                    : "hover:bg-muted/50"
                }`}
              >
                {p === "all" ? "All Time" : p === "monthly" ? "Monthly" : "Weekly"}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-2">
            <Search className="w-4 h-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Filter by university"
              value={universityFilter}
              onChange={(e) => setUniversityFilter(e.target.value)}
              className="border rounded-lg px-3 py-1 text-sm w-48"
            />
          </div>
        </div>
      </div>

      {/* Leaderboard List */}
      {!leaderboard ? (
        <div className="space-y-3">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="bg-card border rounded-xl p-4 animate-pulse flex items-center gap-4">
              <div className="w-8 h-8 bg-muted rounded-full" />
              <div className="flex-1">
                <div className="h-5 bg-muted rounded w-1/4 mb-1" />
                <div className="h-4 bg-muted rounded w-1/3" />
              </div>
            </div>
          ))}
        </div>
      ) : leaderboard.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          <Users className="w-12 h-12 mx-auto mb-3 opacity-30" />
          <p className="text-lg font-medium">No users found</p>
        </div>
      ) : (
        <div className="space-y-2">
          {leaderboard.map((user: any) => (
            <div
              key={user._id}
              className={`bg-card border rounded-xl p-4 flex items-center gap-4 hover:shadow-sm transition-shadow ${
                user.rank <= 3 ? "border-yellow-200" : ""
              }`}
            >
              {/* Rank */}
              <div className="w-8 flex justify-center">{getRankIcon(user.rank)}</div>

              {/* Avatar */}
              <img
                src={user.profilePicture || "/placeholder-avatar.png"}
                alt=""
                className="w-10 h-10 rounded-full"
              />

              {/* Info */}
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <Link
                    href={`/profile/${user._id}`}
                    className="font-semibold hover:text-primary"
                  >
                    {user.name}
                  </Link>
                  <span className={`px-2 py-0.5 rounded text-xs font-medium ${getLevelColor(user.level)}`}>
                    Lv.{user.level}
                  </span>
                </div>
                {user.university && (
                  <p className="text-xs text-muted-foreground">{user.university}</p>
                )}
              </div>

              {/* Stats */}
              <div className="text-right">
                <div className="flex items-center gap-1 text-sm font-semibold">
                  <Star className="w-4 h-4 text-warning" />
                  {user.reputation}
                </div>
                <p className="text-xs text-muted-foreground">
                  {user.achievementCount} badge{user.achievementCount !== 1 ? "s" : ""}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
