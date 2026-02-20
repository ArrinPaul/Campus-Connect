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
    <div className="animate-pulse rounded-xl border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-800">
      <div className="flex items-start gap-3">
        <div className="h-12 w-12 rounded-full bg-gray-200 dark:bg-gray-700" />
        <div className="flex-1 space-y-2">
          <div className="h-4 w-2/3 rounded bg-gray-200 dark:bg-gray-700" />
          <div className="h-3 w-1/3 rounded bg-gray-200 dark:bg-gray-700" />
        </div>
      </div>
      <div className="mt-3 space-y-2">
        <div className="h-3 w-full rounded bg-gray-200 dark:bg-gray-700" />
        <div className="h-3 w-3/4 rounded bg-gray-200 dark:bg-gray-700" />
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
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 sm:text-3xl flex items-center gap-2">
            <Users className="h-7 w-7 text-blue-500" />
            Communities
          </h1>
          <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
            Join groups that match your interests
          </p>
        </div>
        <Link
          href="/communities/new"
          className="flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 transition-colors"
        >
          <Plus className="h-4 w-4" />
          <span className="hidden sm:inline">Create Community</span>
        </Link>
      </div>

      {/* My Communities */}
      {myCommunities && myCommunities.length > 0 && (
        <div className="mb-8">
          <h2 className="mb-3 text-lg font-semibold text-gray-900 dark:text-gray-100">
            My Communities
          </h2>
          <div className="flex gap-3 overflow-x-auto pb-2">
            {myCommunities.map((community) => (
              <Link
                key={community?._id}
                href={`/c/${community?.slug}`}
                className="flex flex-shrink-0 items-center gap-2 rounded-full border border-gray-200 bg-white px-3 py-1.5 text-sm font-medium text-gray-700 hover:border-blue-400 hover:text-blue-600 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-200 dark:hover:border-blue-500 transition-colors"
              >
                <div className="flex h-5 w-5 items-center justify-center rounded-full bg-gradient-to-br from-blue-400 to-purple-500 text-xs font-bold text-white">
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
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search communities..."
          className="w-full rounded-lg border border-gray-300 bg-white py-2.5 pl-10 pr-4 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100 dark:placeholder-gray-400"
        />
      </div>

      {/* Category Tabs */}
      <div className="mb-6 overflow-x-auto">
        <div className="flex min-w-max gap-1 border-b border-gray-200 pb-px dark:border-gray-700">
          {CATEGORIES.map((category) => (
            <button
              key={category}
              onClick={() => setActiveCategory(category)}
              className={`rounded-t-lg px-4 py-2 text-sm font-medium whitespace-nowrap transition-colors ${
                activeCategory === category
                  ? "border-b-2 border-blue-600 text-blue-600 dark:border-blue-400 dark:text-blue-400"
                  : "text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
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
        <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-gray-300 bg-gray-50 py-16 dark:border-gray-600 dark:bg-gray-800/50">
          <Users className="mb-3 h-10 w-10 text-gray-400" />
          <p className="text-lg font-medium text-gray-900 dark:text-gray-100">
            No communities found
          </p>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            {searchQuery
              ? "Try a different search term"
              : "Be the first to create a community!"}
          </p>
          <Link
            href="/communities/new"
            className="mt-4 inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 transition-colors"
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
