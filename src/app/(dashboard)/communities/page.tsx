"use client"

import { useState } from "react"
import { useUser } from "@clerk/nextjs"
import { useQuery } from "convex/react"
import { api } from "@/convex/_generated/api"
import { CommunityCard } from "@/components/communities/CommunityCard"
import { Search, Users, Plus } from "lucide-react"
import Link from "next/link"

const CATEGORIES = [
  "All",
  "Academic",
  "Research",
  "Social",
  "Sports",
  "Clubs",
  "Technology",
  "Arts",
  "Other",
]

function CommunityCardSkeleton() {
  return (
    <div className="animate-pulse rounded-xl border border-border bg-card p-4 border-border bg-card">
      <div className="flex items-start gap-3">
        <div className="h-12 w-12 rounded-full bg-muted bg-muted" />
        <div className="flex-1 space-y-2">
          <div className="h-4 w-2/3 rounded bg-muted bg-muted" />
          <div className="h-3 w-1/3 rounded bg-muted bg-muted" />
        </div>
      </div>
      <div className="mt-3 space-y-2">
        <div className="h-3 w-full rounded bg-muted bg-muted" />
        <div className="h-3 w-3/4 rounded bg-muted bg-muted" />
      </div>
    </div>
  )
}

export default function CommunitiesPage() {
  const { isLoaded, isSignedIn } = useUser()
  const [activeCategory, setActiveCategory] = useState("All")
  const [searchQuery, setSearchQuery] = useState("")

  const communities = useQuery(
    api.communities.getCommunities,
    isLoaded && isSignedIn
      ? {
          category: activeCategory !== "All" ? activeCategory : undefined,
          search: searchQuery || undefined,
        }
      : "skip"
  )

  const myCommunities = useQuery(
    api.communities.getMyCommunities,
    isLoaded && isSignedIn ? {} : "skip"
  )

  return (
    <div className="mx-auto max-w-7xl px-4 py-4 sm:px-6 sm:py-8 lg:px-8">
      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground sm:text-3xl flex items-center gap-2">
            <Users className="h-7 w-7 text-primary" />
            Communities
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Join groups that match your interests
          </p>
        </div>
        <Link
          href="/communities/new"
          className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
        >
          <Plus className="h-4 w-4" />
          <span className="hidden sm:inline">Create Community</span>
        </Link>
      </div>

      {/* My Communities */}
      {myCommunities && myCommunities.length > 0 && (
        <div className="mb-8">
          <h2 className="mb-3 text-lg font-semibold text-foreground">
            My Communities
          </h2>
          <div className="flex gap-3 overflow-x-auto pb-2">
            {myCommunities.map((community) => (
              <Link
                key={community?._id}
                href={`/c/${community?.slug}`}
                className="flex flex-shrink-0 items-center gap-2 rounded-full border border-border bg-card px-3 py-1.5 text-sm font-medium text-foreground hover:border-blue-400 hover:text-primary border-border bg-card text-foreground hover:border-primary transition-colors"
              >
                <div className="flex h-5 w-5 items-center justify-center rounded-full bg-gradient-to-br from-blue-400 to-purple-500 text-xs font-bold text-primary-foreground">
                  {community?.name.charAt(0)}
                </div>
                {community?.name}
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Search */}
      <div className="mb-4 relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search communities..."
          className="w-full rounded-lg border border-border bg-card py-2.5 pl-10 pr-4 text-sm focus:border-ring focus:outline-none focus:ring-1 focus:ring-ring border-border bg-card text-foreground dark:placeholder:text-muted-foreground"
        />
      </div>

      {/* Category Tabs */}
      <div className="mb-6 overflow-x-auto">
        <div className="flex min-w-max gap-1 border-b border-border pb-px border-border">
          {CATEGORIES.map((category) => (
            <button
              key={category}
              onClick={() => setActiveCategory(category)}
              className={`rounded-t-lg px-4 py-2 text-sm font-medium whitespace-nowrap transition-colors ${
                activeCategory === category
                  ? "border-b-2 border-primary text-primary dark:border-blue-400 text-primary"
                  : "text-muted-foreground hover:text-foreground text-muted-foreground hover:text-foreground"
              }`}
            >
              {category}
            </button>
          ))}
        </div>
      </div>

      {/* Community Grid */}
      {communities === undefined ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <CommunityCardSkeleton key={i} />
          ))}
        </div>
      ) : communities.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border bg-muted/50 py-16 border-border bg-card/50">
          <Users className="mb-3 h-10 w-10 text-muted-foreground" />
          <p className="text-lg font-medium text-foreground">
            No communities found
          </p>
          <p className="mt-1 text-sm text-muted-foreground">
            {searchQuery
              ? "Try a different search term"
              : "Be the first to create a community!"}
          </p>
          <Link
            href="/communities/new"
            className="mt-4 inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
          >
            <Plus className="h-4 w-4" />
            Create Community
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {communities.map((community) => (
            <CommunityCard key={community._id} community={community as any} />
          ))}
        </div>
      )}
    </div>
  )
}
