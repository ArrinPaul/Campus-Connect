"use client"

import { useState } from "react"
import { useQuery } from "@/lib/api"
import { api } from "@/lib/api"
import { Trophy, Medal, Award, Flame, Building2, Search, Sparkles, BookOpen, CheckCircle, ArrowUpRight } from "lucide-react"
import Image from "next/image"
import Link from "next/link"
import { cn } from "@/lib/utils"

export default function LeaderboardPage() {
  const [period, setPeriod] = useState<"weekly" | "monthly" | "all-time">("all-time")
  const [selectedUniversity, setSelectedUniversity] = useState<string>("all")
  const [searchFilter, setSearchFilter] = useState<string>("")

  const leaderboardData = useQuery(api.gamification.getLeaderboard, {
    period,
    university: selectedUniversity === "all" ? undefined : selectedUniversity,
    limit: 50,
  })

  const isLoading = leaderboardData === undefined
  const entries = leaderboardData?.entries ?? []
  const currentUserRank = leaderboardData?.currentUserRank
  const currentUserPoints = leaderboardData?.currentUserPoints

  // Unique universities present in entries for filter options
  const universities = Array.from(
    new Set(
      entries
        .map((e: any) => e.university)
        .filter(Boolean)
    )
  )

  const filteredEntries = searchFilter
    ? entries.filter(
        (e: any) =>
          e.name?.toLowerCase().includes(searchFilter.toLowerCase()) ||
          e.username?.toLowerCase().includes(searchFilter.toLowerCase()) ||
          e.university?.toLowerCase().includes(searchFilter.toLowerCase())
      )
    : entries

  const topThree = filteredEntries.slice(0, 3)
  const remainingEntries = filteredEntries.slice(3)

  return (
    <div className="w-full max-w-4xl mx-auto space-y-6 pb-12">
      {/* Header */}
      <div className="bg-card border border-hairline rounded-2xl p-6 shadow-sm relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full blur-3xl -z-0" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-primary font-bold text-sm tracking-wide uppercase">
              <Trophy className="w-4 h-4 text-amber-500" />
              <span>Campus Leaderboard</span>
            </div>
            <h1 className="text-2xl md:text-3xl font-extrabold text-ink tracking-tight">
              Academic & Peer Recognition
            </h1>
            <p className="text-sm text-muted-foreground max-w-lg">
              Rankings driven by validated contributions: accepted answers (+15), research preprints (+10), helpful peer reviews (+10), and community upvotes (+5).
            </p>
          </div>

          {/* Current User Quick Rank Pill */}
          {currentUserRank !== null && currentUserRank !== undefined && (
            <div className="flex items-center gap-3 bg-primary/10 border border-primary/20 rounded-xl px-4 py-3 shrink-0">
              <div className="h-10 w-10 rounded-full bg-primary flex items-center justify-center text-primary-foreground font-extrabold text-base shadow-sm">
                #{currentUserRank}
              </div>
              <div>
                <p className="text-xs font-semibold text-primary uppercase">Your Rank</p>
                <p className="text-sm font-bold text-ink">{currentUserPoints ?? 0} pts</p>
              </div>
            </div>
          )}
        </div>

        {/* Filter Controls Bar */}
        <div className="mt-6 pt-6 border-t border-hairline flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          {/* Period Tabs */}
          <div className="flex items-center bg-muted/60 p-1 rounded-xl border border-hairline">
            <button
              onClick={() => setPeriod("weekly")}
              className={cn(
                "px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all",
                period === "weekly"
                  ? "bg-card text-primary shadow-sm"
                  : "text-muted-foreground hover:text-ink"
              )}
            >
              Weekly
            </button>
            <button
              onClick={() => setPeriod("monthly")}
              className={cn(
                "px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all",
                period === "monthly"
                  ? "bg-card text-primary shadow-sm"
                  : "text-muted-foreground hover:text-ink"
              )}
            >
              Monthly
            </button>
            <button
              onClick={() => setPeriod("all-time")}
              className={cn(
                "px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all",
                period === "all-time"
                  ? "bg-card text-primary shadow-sm"
                  : "text-muted-foreground hover:text-ink"
              )}
            >
              All Time
            </button>
          </div>

          {/* University Selector & Search */}
          <div className="flex items-center gap-2 flex-1 sm:justify-end">
            <div className="relative flex-1 sm:max-w-[200px]">
              <Building2 className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <select
                value={selectedUniversity}
                onChange={(e) => setSelectedUniversity(e.target.value)}
                className="w-full text-xs rounded-xl border border-hairline bg-card pl-8 pr-3 py-2 text-ink focus:outline-none focus:ring-1 focus:ring-primary shadow-sm"
              >
                <option value="all">All Universities</option>
                {universities.map((uni: any) => (
                  <option key={uni} value={uni}>
                    {uni}
                  </option>
                ))}
              </select>
            </div>

            <div className="relative flex-1 sm:max-w-[180px]">
              <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <input
                type="text"
                placeholder="Search..."
                value={searchFilter}
                onChange={(e) => setSearchFilter(e.target.value)}
                className="w-full text-xs rounded-xl border border-hairline bg-card pl-8 pr-3 py-2 text-ink placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary shadow-sm"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Loading Skeleton */}
      {isLoading && (
        <div className="space-y-3">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="h-16 rounded-xl bg-card border border-hairline animate-pulse" />
          ))}
        </div>
      )}

      {/* Empty State */}
      {!isLoading && filteredEntries.length === 0 && (
        <div className="bg-card border border-hairline rounded-2xl p-12 text-center space-y-3">
          <div className="h-12 w-12 rounded-full bg-muted flex items-center justify-center mx-auto text-muted-foreground">
            <Flame className="w-6 h-6" />
          </div>
          <h3 className="font-bold text-base text-ink">No Activity Found for this Period</h3>
          <p className="text-xs text-muted-foreground max-w-sm mx-auto">
            Be the first to earn reputation by answering questions, publishing research preprints, or reviewing peers!
          </p>
          <div className="pt-2">
            <Link
              href="/q-and-a"
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-primary text-primary-foreground text-xs font-semibold hover:opacity-90 transition-opacity"
            >
              <span>Explore Questions</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      )}

      {/* Top 3 Podium (Desktop/Tablet) */}
      {!isLoading && topThree.length > 0 && !searchFilter && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
          {/* Rank 2 (Silver) */}
          {topThree[1] && (
            <div className="bg-card border border-hairline rounded-2xl p-5 flex flex-col items-center text-center relative order-2 md:order-1 hover:border-border transition-colors">
              <div className="absolute top-3 right-3 text-slate-400 font-black text-xs flex items-center gap-1">
                <Medal className="w-4 h-4 text-slate-400" /> #2
              </div>
              <div className="h-16 w-16 rounded-full overflow-hidden border-2 border-slate-300 relative mb-3 bg-muted">
                {topThree[1].profilePicture ? (
                  <Image src={topThree[1].profilePicture} alt={topThree[1].name} fill className="object-cover" />
                ) : (
                  <div className="h-full w-full flex items-center justify-center font-bold text-lg text-slate-500">
                    {topThree[1].name[0]}
                  </div>
                )}
              </div>
              <Link href={`/profile/${topThree[1].userId}`} className="font-bold text-sm text-ink hover:underline">
                {topThree[1].name}
              </Link>
              <p className="text-[11px] text-muted-foreground truncate max-w-[160px]">{topThree[1].university || "Campus Scholar"}</p>
              <div className="mt-3 flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-100 dark:bg-slate-800/60 text-slate-700 dark:text-slate-300 text-xs font-bold">
                <span>{topThree[1].points} pts</span>
                <span className="text-[10px] text-muted-foreground">· Lvl {topThree[1].level}</span>
              </div>
            </div>
          )}

          {/* Rank 1 (Gold) */}
          {topThree[0] && (
            <div className="bg-card border-2 border-amber-500/30 rounded-2xl p-6 flex flex-col items-center text-center relative order-1 md:order-2 bg-gradient-to-b from-amber-500/5 to-transparent shadow-md">
              <div className="absolute -top-3 px-3 py-0.5 rounded-full bg-amber-500 text-white font-extrabold text-[11px] flex items-center gap-1 shadow-sm">
                <Trophy className="w-3.5 h-3.5 fill-current" /> #1 Champion
              </div>
              <div className="h-20 w-20 rounded-full overflow-hidden border-4 border-amber-500 relative mb-3 bg-muted shadow-sm">
                {topThree[0].profilePicture ? (
                  <Image src={topThree[0].profilePicture} alt={topThree[0].name} fill className="object-cover" />
                ) : (
                  <div className="h-full w-full flex items-center justify-center font-extrabold text-2xl text-amber-600">
                    {topThree[0].name[0]}
                  </div>
                )}
              </div>
              <Link href={`/profile/${topThree[0].userId}`} className="font-extrabold text-base text-ink hover:underline">
                {topThree[0].name}
              </Link>
              <p className="text-xs text-muted-foreground truncate max-w-[180px]">{topThree[0].university || "Campus Scholar"}</p>
              <div className="mt-3 flex items-center gap-1.5 px-3.5 py-1 rounded-full bg-amber-500/15 text-amber-700 dark:text-amber-400 text-sm font-extrabold">
                <Sparkles className="w-3.5 h-3.5" />
                <span>{topThree[0].points} pts</span>
                <span className="text-[11px] font-semibold opacity-80">· Lvl {topThree[0].level}</span>
              </div>
            </div>
          )}

          {/* Rank 3 (Bronze) */}
          {topThree[2] && (
            <div className="bg-card border border-hairline rounded-2xl p-5 flex flex-col items-center text-center relative order-3 hover:border-border transition-colors">
              <div className="absolute top-3 right-3 text-amber-700 dark:text-amber-500 font-black text-xs flex items-center gap-1">
                <Medal className="w-4 h-4 text-amber-700 dark:text-amber-500" /> #3
              </div>
              <div className="h-16 w-16 rounded-full overflow-hidden border-2 border-amber-700/50 relative mb-3 bg-muted">
                {topThree[2].profilePicture ? (
                  <Image src={topThree[2].profilePicture} alt={topThree[2].name} fill className="object-cover" />
                ) : (
                  <div className="h-full w-full flex items-center justify-center font-bold text-lg text-amber-700">
                    {topThree[2].name[0]}
                  </div>
                )}
              </div>
              <Link href={`/profile/${topThree[2].userId}`} className="font-bold text-sm text-ink hover:underline">
                {topThree[2].name}
              </Link>
              <p className="text-[11px] text-muted-foreground truncate max-w-[160px]">{topThree[2].university || "Campus Scholar"}</p>
              <div className="mt-3 flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-700/10 text-amber-800 dark:text-amber-400 text-xs font-bold">
                <span>{topThree[2].points} pts</span>
                <span className="text-[10px] text-muted-foreground">· Lvl {topThree[2].level}</span>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Full Leaderboard List */}
      {!isLoading && (searchFilter ? filteredEntries : remainingEntries).length > 0 && (
        <div className="bg-card border border-hairline rounded-2xl overflow-hidden shadow-sm divide-y divide-hairline">
          <div className="px-5 py-3 bg-muted/40 text-[11px] font-bold text-muted-foreground uppercase tracking-wider flex items-center justify-between">
            <div className="flex items-center gap-4">
              <span className="w-6 text-center">#</span>
              <span>Scholar</span>
            </div>
            <div className="flex items-center gap-6">
              <span className="hidden sm:inline">Badges</span>
              <span>Reputation</span>
            </div>
          </div>

          {(searchFilter ? filteredEntries : remainingEntries).map((entry: any) => (
            <div
              key={entry.userId}
              className="px-5 py-3.5 flex items-center justify-between hover:bg-muted/20 transition-colors"
            >
              <div className="flex items-center gap-3 min-w-0">
                <span className="w-6 text-center text-xs font-extrabold text-muted-foreground">
                  {entry.rank}
                </span>

                <div className="h-9 w-9 rounded-full bg-muted overflow-hidden relative shrink-0">
                  {entry.profilePicture ? (
                    <Image src={entry.profilePicture} alt={entry.name} fill className="object-cover" />
                  ) : (
                    <div className="h-full w-full flex items-center justify-center font-bold text-xs">
                      {entry.name[0]}
                    </div>
                  )}
                </div>

                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <Link
                      href={`/profile/${entry.userId}`}
                      className="font-bold text-xs sm:text-sm text-ink hover:underline truncate"
                    >
                      {entry.name}
                    </Link>
                    {entry.role && (
                      <span className="hidden sm:inline-block text-[10px] font-semibold px-2 py-0.5 rounded-full bg-primary/10 text-primary">
                        {entry.role}
                      </span>
                    )}
                  </div>
                  <p className="text-[11px] text-muted-foreground truncate max-w-[200px] sm:max-w-none">
                    {entry.university || "Academic Contributor"}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-4 shrink-0">
                {/* Badges List */}
                <div className="hidden sm:flex items-center gap-1">
                  {entry.badges?.slice(0, 3).map((b: any) => (
                    <span
                      key={b.id}
                      title={`${b.name}: ${b.description}`}
                      className="h-6 w-6 rounded-full bg-amber-500/10 text-amber-600 flex items-center justify-center text-xs"
                    >
                      {b.id === "top_researcher" && <BookOpen className="w-3 h-3" />}
                      {b.id === "helpful_peer" && <CheckCircle className="w-3 h-3" />}
                      {b.id === "campus_leader" && <Trophy className="w-3 h-3" />}
                    </span>
                  ))}
                </div>

                {/* Points Pill */}
                <div className="text-right">
                  <span className="text-xs sm:text-sm font-extrabold text-primary">
                    {entry.points} pts
                  </span>
                  <p className="text-[10px] text-muted-foreground font-semibold">
                    Lvl {entry.level}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
