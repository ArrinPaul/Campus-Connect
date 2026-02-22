"use client"

import { useState, useEffect } from "react"
import { useUser } from "@clerk/nextjs"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { useQuery } from "convex/react"
import { api } from "@/../convex/_generated/api"
import { PostComposer } from "@/components/posts/PostComposer"
import { FeedContainer } from "@/components/feed/FeedContainer"
import { ErrorBoundary } from "@/components/error-boundary"
import { TrendingHashtags } from "@/components/trending/TrendingHashtags"
import { StoryRow } from "@/components/stories/StoryRow"
import { SuggestedUsers } from "@/components/discover/SuggestedUsers"
import { RecommendedPosts, TrendingInSkill } from "@/components/feed/RecommendedPosts"
import { cn } from "@/lib/utils"
import { Sparkles, Users, TrendingUp, PenLine, ArrowRight } from "lucide-react"

export type FeedType = "for-you" | "following" | "trending"

const FEED_STORAGE_KEY = "campus-connect-feed-type"

const FEED_TABS = [
  { key: "for-you" as const,  label: "For You",   icon: Sparkles  },
  { key: "following" as const, label: "Following", icon: Users     },
  { key: "trending" as const,  label: "Trending",  icon: TrendingUp },
] as const

export default function FeedPage() {
  const { isLoaded, isSignedIn, user } = useUser()
  const router = useRouter()
  const [feedType, setFeedType] = useState<FeedType>("for-you")

  const onboardingStatus = useQuery(api.users.getOnboardingStatus)

  // Redirect new users to complete onboarding first
  useEffect(() => {
    if (onboardingStatus !== undefined && onboardingStatus !== null && !onboardingStatus.complete) {
      router.replace("/onboarding")
    }
  }, [onboardingStatus, router])

  useEffect(() => {
    const saved = localStorage.getItem(FEED_STORAGE_KEY) as FeedType | null
    if (saved && ["for-you", "following", "trending"].includes(saved)) {
      setFeedType(saved)
    }
  }, [])

  const handleFeedTypeChange = (type: FeedType) => {
    setFeedType(type)
    localStorage.setItem(FEED_STORAGE_KEY, type)
  }

  if (!isLoaded) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="h-9 w-9 animate-spin rounded-full border-[3px] border-border border-t-primary" />
          <p className="text-sm text-muted-foreground">Loading your feed…</p>
        </div>
      </div>
    )
  }

  if (!isSignedIn) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="text-center">
          <div className="inline-flex h-16 w-16 items-center justify-center rounded-xl brand-gradient mb-4">
            <Sparkles className="h-8 w-8 text-white" />
          </div>
          <h2 className="text-xl font-bold text-foreground font-display">Sign in to see your feed</h2>
          <p className="mt-2 text-muted-foreground text-sm">Connect with peers · Discover research · Grow your network</p>
        </div>
      </div>
    )
  }

  const firstName = user?.firstName ?? "there"

  return (
    <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">

        {/* ── Main column ── */}
        <div className="lg:col-span-8 space-y-4">

          {/* Welcome strip */}
          <div className="rounded-2xl border border-border/60 bg-card/80 backdrop-blur-xl p-4 shadow-elevation-1">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="text-[13px] text-muted-foreground">Welcome back</p>
                <h1 className="text-lg sm:text-xl font-semibold text-foreground font-display">
                  Good to see you, {firstName}
                </h1>
              </div>
              <div className="presence-chip">
                <span className="presence-pulse" aria-hidden="true" />
                <span className="text-foreground">Live now</span>
                <span className="text-muted-foreground/70">in your network</span>
              </div>
            </div>
            <div className="mt-3 flex flex-wrap items-center gap-2">
              <Link
                href="#composer"
                className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-3 py-1.5 text-xs font-semibold text-primary hover:bg-primary/15 transition-colors"
              >
                <PenLine className="h-3.5 w-3.5" /> Start a post
              </Link>
              <Link
                href="/discover"
                className="inline-flex items-center gap-2 rounded-full border border-border/60 px-3 py-1.5 text-xs font-semibold text-foreground hover:bg-muted/60 transition-colors"
              >
                Explore communities <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </div>
          </div>

          {/* Stories */}
          <ErrorBoundary>
            <div className="rounded-xl border border-border/50 bg-card shadow-elevation-1 px-4 py-3 overflow-hidden">
              <StoryRow />
            </div>
          </ErrorBoundary>

          {/* Composer card */}
          <ErrorBoundary>
            <div id="composer" className="rounded-xl border border-border/50 bg-card shadow-elevation-1 overflow-hidden">
              {/* gradient header strip */}
              <div className="h-1 w-full brand-gradient" />
              <div className="p-5">
                <div className="flex items-center gap-3 mb-4">
                  {user?.imageUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={user.imageUrl} alt={firstName} className="h-9 w-9 rounded-full object-cover story-ring" />
                  ) : (
                    <div className="h-9 w-9 rounded-full brand-gradient flex items-center justify-center text-white text-sm font-bold shrink-0">
                      {firstName[0].toUpperCase()}
                    </div>
                  )}
                  <div>
                    <p className="text-[13px] font-semibold text-foreground">Hey {firstName} 👋</p>
                    <p className="text-[12px] text-muted-foreground flex items-center gap-1">
                      <PenLine className="h-3 w-3" /> Share what&apos;s on your mind
                    </p>
                  </div>
                </div>
                <PostComposer />
              </div>
            </div>
          </ErrorBoundary>

          {/* Feed tabs */}
          <div className="rounded-xl border border-border/50 bg-card shadow-elevation-1 p-1.5 flex gap-1">
            {FEED_TABS.map(({ key, label, icon: Icon }) => (
              <button
                key={key}
                onClick={() => handleFeedTypeChange(key)}
                className={cn(
                  "relative flex-1 flex items-center justify-center gap-2 rounded-lg px-3 py-2.5 text-[13px] font-semibold transition-all duration-200",
                  feedType === key
                    ? "text-primary-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted/60"
                )}
              >
                {feedType === key && (
                  <span
                    className="absolute inset-0 rounded-lg brand-gradient transition-all duration-300 ease-[cubic-bezier(0.16,1,0.3,1)]"
                    aria-hidden
                    style={{ willChange: "transform" }}
                  />
                )}
                <Icon className="relative h-3.5 w-3.5" />
                <span className="relative">{label}</span>
              </button>
            ))}
          </div>

          {/* Feed */}
          <ErrorBoundary>
            <FeedContainer feedType={feedType} />
          </ErrorBoundary>
        </div>

        {/* ── Right sidebar ── */}
        <aside className="hidden lg:block lg:col-span-4">
          <div className="sticky top-[76px] space-y-4">

            {/* Trending hashtags */}
            <div className="rounded-xl border border-border/50 bg-card shadow-elevation-1 overflow-hidden">
              <div className="h-[3px] w-full gradient-warm" />
              <ErrorBoundary>
                <TrendingHashtags limit={10} />
              </ErrorBoundary>
            </div>

            {/* Suggested users */}
            <div className="rounded-xl border border-border/50 bg-card shadow-elevation-1 overflow-hidden">
              <div className="h-[3px] w-full brand-gradient" />
              <ErrorBoundary>
                <SuggestedUsers limit={3} showSeeAll />
              </ErrorBoundary>
            </div>

            {/* Recommended posts */}
            <div className="rounded-xl border border-border/50 bg-card shadow-elevation-1 overflow-hidden">
              <div className="h-[3px] w-full" style={{ background: "linear-gradient(90deg, hsl(var(--accent-emerald)), hsl(var(--accent-sky)))" }} />
              <ErrorBoundary>
                <RecommendedPosts limit={3} />
              </ErrorBoundary>
            </div>

            {/* Trending in skill */}
            <div className="rounded-xl border border-border/50 bg-card shadow-elevation-1 overflow-hidden">
              <div className="h-[3px] w-full" style={{ background: "linear-gradient(90deg, hsl(var(--accent-violet)), hsl(var(--accent-rose)))" }} />
              <ErrorBoundary>
                <TrendingInSkill limit={5} />
              </ErrorBoundary>
            </div>
          </div>
        </aside>

      </div>
    </div>
  )
}
