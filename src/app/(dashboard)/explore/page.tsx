"use client"

import { useState } from "react"
import { useUser } from "@clerk/nextjs"
import { useQuery } from "convex/react"
import { api } from "@/convex/_generated/api"
import { PostCard } from "@/components/posts/PostCard"
import { RecommendedPosts, TrendingInSkill, PopularInUniversity } from "@/components/feed/RecommendedPosts"
import { SuggestedUsers } from "@/components/discover/SuggestedUsers"
import { Sparkles, TrendingUp, GraduationCap, Compass, RefreshCw } from "lucide-react"

type ExploreTab = "for-you" | "trending-skills" | "university"

export default function ExplorePage() {
  const { isLoaded, isSignedIn } = useUser()
  const [activeTab, setActiveTab] = useState<ExploreTab>("for-you")

  const recommended = useQuery(
    api.recommendations.getRecommendedPosts,
    isLoaded && isSignedIn && activeTab === "for-you" ? { limit: 20 } : "skip"
  )
  const trendingSkill = useQuery(
    api.recommendations.getTrendingInSkill,
    isLoaded && isSignedIn && activeTab === "trending-skills" ? { limit: 20 } : "skip"
  )
  const popular = useQuery(
    api.recommendations.getPopularInUniversity,
    isLoaded && isSignedIn && activeTab === "university" ? { limit: 20 } : "skip"
  )

  const tabs: { id: ExploreTab; label: string; icon: React.ReactNode }[] = [
    { id: "for-you", label: "For You", icon: <Sparkles className="h-4 w-4" /> },
    { id: "trending-skills", label: "Trending in Skills", icon: <TrendingUp className="h-4 w-4" /> },
    { id: "university", label: "Your University", icon: <GraduationCap className="h-4 w-4" /> },
  ]

  // Determine posts to display based on active tab
  let posts: any[] = []
  let isLoading = false
  let emptyMessage = ""

  if (activeTab === "for-you") {
    posts = recommended?.items ?? []
    isLoading = recommended === undefined
    emptyMessage = "Interact with posts to get personalised recommendations!"
  } else if (activeTab === "trending-skills") {
    posts = trendingSkill?.items ?? []
    isLoading = trendingSkill === undefined
    emptyMessage = "Add skills to your profile to see trending posts in your areas."
  } else if (activeTab === "university") {
    posts = popular?.items ?? []
    isLoading = popular === undefined
    emptyMessage = "Add your university to your profile to see popular posts."
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-4 sm:px-6 sm:py-8 lg:px-8">
      {/* Header */}
      <div className="mb-4 sm:mb-6">
        <h1 className="flex items-center gap-2 text-2xl font-bold text-foreground sm:text-3xl">
          <Compass className="h-7 w-7 text-primary" />
          Explore
        </h1>
        <p className="mt-1 text-sm text-muted-foreground sm:mt-2 sm:text-base">
          Discover content tailored to your interests
        </p>
      </div>

      {/* Tab switcher */}
      <div className="mb-4 sm:mb-6 flex gap-1 overflow-x-auto rounded-lg bg-muted p-1">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-1.5 whitespace-nowrap rounded-md px-3 py-2 text-sm font-medium transition-colors ${
              activeTab === tab.id
                ? "bg-card text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            {tab.icon}
            {tab.label}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-4 sm:gap-6 lg:grid-cols-4">
        {/* Main content area */}
        <main className="lg:col-span-3 space-y-4">
          {isLoading ? (
            // Loading skeletons
            <div className="space-y-4">
              {[...Array(5)].map((_, i) => (
                <div
                  key={i}
                  className="rounded-lg border border-border bg-card p-4"
                >
                  <div className="flex items-center gap-3 mb-3">
                    <div className="h-10 w-10 rounded-full bg-muted bg-muted animate-pulse" />
                    <div className="flex-1 space-y-1">
                      <div className="h-4 w-24 rounded bg-muted bg-muted animate-pulse" />
                      <div className="h-3 w-16 rounded bg-muted bg-muted animate-pulse" />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <div className="h-3 w-full rounded bg-muted bg-muted animate-pulse" />
                    <div className="h-3 w-3/4 rounded bg-muted bg-muted animate-pulse" />
                    <div className="h-3 w-1/2 rounded bg-muted bg-muted animate-pulse" />
                  </div>
                </div>
              ))}
            </div>
          ) : posts.length === 0 ? (
            // Empty state
            <div className="rounded-lg border border-border bg-card p-8 text-center sm:p-12">
              <Compass className="mx-auto h-12 w-12 text-muted-foreground dark:text-muted-foreground mb-4" />
              <p className="text-base font-medium text-foreground sm:text-lg">
                Nothing to show yet
              </p>
              <p className="mt-1 text-sm text-muted-foreground sm:mt-2">
                {emptyMessage}
              </p>
            </div>
          ) : (
            // Post list
            <div className="space-y-4">
              {posts.map((item: any) => {
                const post = item.post
                if (!post || !post.author) return null
                return (
                  <PostCard
                    key={item._id}
                    post={post}
                    author={post.author}
                  />
                )
              })}
            </div>
          )}
        </main>

        {/* Sidebar */}
        <aside className="hidden lg:block lg:col-span-1">
          <div className="space-y-4 sticky top-4">
            <SuggestedUsers limit={3} showSeeAll />
            <RecommendedPosts limit={3} />
          </div>
        </aside>
      </div>
    </div>
  )
}
