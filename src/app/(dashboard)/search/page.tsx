"use client"

import { useState, useEffect, useCallback } from "react"
import { useUser } from "@clerk/nextjs"
import { useQuery } from "convex/react"
import { api } from "@/convex/_generated/api"
import { useSearchParams } from "next/navigation"
import Link from "next/link"
import Image from "next/image"
import {
  Search,
  X,
  Hash,
  Users,
  FileText,
  Clock,
  Filter,
  SlidersHorizontal,
  Heart,
  MessageCircle,
} from "lucide-react"
import { PostCard } from "@/components/posts/PostCard"
import { UserCard } from "@/components/profile/UserCard"
import type { FunctionReturnType } from "convex/server"

type UniversalSearchResult = FunctionReturnType<typeof api.search.universalSearch>
type PostSearchResult = FunctionReturnType<typeof api.search.searchPosts>
type UserSearchResult = FunctionReturnType<typeof api.search.searchUsersEnhanced>
type HashtagSearchResult = FunctionReturnType<typeof api.search.searchHashtags>

type SearchTab = "all" | "users" | "posts" | "hashtags"

const RECENT_SEARCHES_KEY = "campus-connect-recent-searches"
const MAX_RECENT_SEARCHES = 10

export default function SearchPage() {
  const { isLoaded, isSignedIn } = useUser()
  const searchParams = useSearchParams()

  const [query, setQuery] = useState(searchParams?.get("q") ?? "")
  const [activeTab, setActiveTab] = useState<SearchTab>("all")
  const [showFilters, setShowFilters] = useState(false)
  const [recentSearches, setRecentSearches] = useState<string[]>([])

  // Filters
  const [dateFrom, setDateFrom] = useState<string>("")
  const [dateTo, setDateTo] = useState<string>("")
  const [mediaType, setMediaType] = useState<string>("any")
  const [minEngagement, setMinEngagement] = useState<string>("")
  const [userRole, setUserRole] = useState<string>("")
  const [university, setUniversity] = useState<string>("")

  // Load recent searches
  useEffect(() => {
    try {
      const saved = localStorage.getItem(RECENT_SEARCHES_KEY)
      if (saved) setRecentSearches(JSON.parse(saved))
    } catch {}
  }, [])

  const saveSearch = useCallback(
    (q: string) => {
      if (!q.trim()) return
      const updated = [q, ...recentSearches.filter((s) => s !== q)].slice(
        0,
        MAX_RECENT_SEARCHES
      )
      setRecentSearches(updated)
      localStorage.setItem(RECENT_SEARCHES_KEY, JSON.stringify(updated))
    },
    [recentSearches]
  )

  const clearRecentSearches = () => {
    setRecentSearches([])
    localStorage.removeItem(RECENT_SEARCHES_KEY)
  }

  // Query hooks — only relevant tab is active
  const universalResults = useQuery(
    api.search.universalSearch,
    isLoaded && isSignedIn && query.trim() && activeTab === "all"
      ? { query: query.trim(), limit: 5 }
      : "skip"
  )

  const postResults = useQuery(
    api.search.searchPosts,
    isLoaded && isSignedIn && query.trim() && activeTab === "posts"
      ? {
          query: query.trim(),
          limit: 20,
          dateFrom: dateFrom ? new Date(dateFrom).getTime() : undefined,
          dateTo: dateTo ? new Date(dateTo).getTime() : undefined,
          mediaType:
            mediaType !== "any"
              ? (mediaType as "image" | "video" | "file" | "link")
              : undefined,
          minEngagement: minEngagement ? parseInt(minEngagement, 10) : undefined,
        }
      : "skip"
  )

  const userResults = useQuery(
    api.search.searchUsersEnhanced,
    isLoaded && isSignedIn && query.trim() && activeTab === "users"
      ? {
          query: query.trim(),
          limit: 20,
          role: userRole
            ? (userRole as "Student" | "Research Scholar" | "Faculty")
            : undefined,
          university: university || undefined,
        }
      : "skip"
  )

  const hashtagResults = useQuery(
    api.search.searchHashtags,
    isLoaded && isSignedIn && query.trim() && activeTab === "hashtags"
      ? { query: query.trim(), limit: 20 }
      : "skip"
  )

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (query.trim()) saveSearch(query.trim())
  }

  const tabs: { id: SearchTab; label: string; icon: React.ReactNode }[] = [
    { id: "all", label: "All", icon: <Search className="h-4 w-4" /> },
    { id: "users", label: "Users", icon: <Users className="h-4 w-4" /> },
    { id: "posts", label: "Posts", icon: <FileText className="h-4 w-4" /> },
    { id: "hashtags", label: "Hashtags", icon: <Hash className="h-4 w-4" /> },
  ]

  return (
    <div className="mx-auto max-w-5xl px-4 py-4 sm:px-6 sm:py-8 lg:px-8">
      {/* Search header */}
      <form onSubmit={handleSubmit} className="mb-4 sm:mb-6">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search users, posts, hashtags…"
            className="w-full rounded-lg border border-border bg-card py-3 pl-10 pr-10 text-sm text-foreground placeholder:text-muted-foreground focus:border-ring focus:ring-2 focus:ring-ring/20 focus:outline-none"
            autoFocus
          />
          {query && (
            <button
              type="button"
              onClick={() => setQuery("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
      </form>

      {/* No query yet — show recent searches */}
      {!query.trim() && (
        <div className="rounded-lg border border-border bg-card p-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="flex items-center gap-2 text-sm font-semibold text-foreground">
              <Clock className="h-4 w-4 text-muted-foreground" />
              Recent Searches
            </h3>
            {recentSearches.length > 0 && (
              <button
                onClick={clearRecentSearches}
                className="text-xs text-destructive hover:text-destructive"
              >
                Clear all
              </button>
            )}
          </div>
          {recentSearches.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">
              No recent searches
            </p>
          ) : (
            <div className="space-y-1">
              {recentSearches.map((s, i) => (
                <button
                  key={i}
                  onClick={() => {
                    setQuery(s)
                    saveSearch(s)
                  }}
                  className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-sm text-foreground hover:bg-accent transition-colors"
                >
                  <Clock className="h-3.5 w-3.5 text-muted-foreground" />
                  {s}
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Has query — show tabs + results */}
      {query.trim() && (
        <>
          {/* Tab bar */}
          <div className="mb-4 flex items-center gap-2">
            <div className="flex gap-1 overflow-x-auto rounded-lg bg-muted p-1 flex-1">
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

            {/* Filter toggle (for posts/users tabs) */}
            {(activeTab === "posts" || activeTab === "users") && (
              <button
                onClick={() => setShowFilters(!showFilters)}
                className={`flex items-center gap-1 rounded-md px-3 py-2 text-sm font-medium transition-colors border ${
                  showFilters
                    ? "bg-primary/10 text-primary border-primary/20"
                    : "bg-card text-muted-foreground border-border hover:bg-accent"
                }`}
              >
                <SlidersHorizontal className="h-4 w-4" />
                Filters
              </button>
            )}
          </div>

          {/* Filters panel */}
          {showFilters && activeTab === "posts" && (
            <div className="mb-4 rounded-lg border border-border bg-card p-4">
              <h4 className="text-sm font-semibold text-foreground mb-3">
                Post Filters
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                <div>
                  <label className="text-xs text-muted-foreground mb-1 block">
                    Date From
                  </label>
                  <input
                    type="date"
                    value={dateFrom}
                    onChange={(e) => setDateFrom(e.target.value)}
                    className="w-full rounded-md border border-border bg-card px-2 py-1.5 text-sm text-foreground"
                  />
                </div>
                <div>
                  <label className="text-xs text-muted-foreground mb-1 block">
                    Date To
                  </label>
                  <input
                    type="date"
                    value={dateTo}
                    onChange={(e) => setDateTo(e.target.value)}
                    className="w-full rounded-md border border-border bg-card px-2 py-1.5 text-sm text-foreground"
                  />
                </div>
                <div>
                  <label className="text-xs text-muted-foreground mb-1 block">
                    Content Type
                  </label>
                  <select
                    value={mediaType}
                    onChange={(e) => setMediaType(e.target.value)}
                    className="w-full rounded-md border border-border bg-card px-2 py-1.5 text-sm text-foreground"
                  >
                    <option value="any">Any</option>
                    <option value="image">Image</option>
                    <option value="video">Video</option>
                    <option value="file">File</option>
                    <option value="link">Link</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs text-muted-foreground mb-1 block">
                    Min Engagement
                  </label>
                  <input
                    type="number"
                    min={0}
                    value={minEngagement}
                    onChange={(e) => setMinEngagement(e.target.value)}
                    placeholder="0"
                    className="w-full rounded-md border border-border bg-card px-2 py-1.5 text-sm text-foreground"
                  />
                </div>
              </div>
            </div>
          )}

          {showFilters && activeTab === "users" && (
            <div className="mb-4 rounded-lg border border-border bg-card p-4">
              <h4 className="text-sm font-semibold text-foreground mb-3">
                User Filters
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-muted-foreground mb-1 block">
                    Role
                  </label>
                  <select
                    value={userRole}
                    onChange={(e) => setUserRole(e.target.value)}
                    className="w-full rounded-md border border-border bg-card px-2 py-1.5 text-sm text-foreground"
                  >
                    <option value="">Any Role</option>
                    <option value="Student">Student</option>
                    <option value="Research Scholar">Research Scholar</option>
                    <option value="Faculty">Faculty</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs text-muted-foreground mb-1 block">
                    University
                  </label>
                  <input
                    type="text"
                    value={university}
                    onChange={(e) => setUniversity(e.target.value)}
                    placeholder="Filter by university..."
                    className="w-full rounded-md border border-border bg-card px-2 py-1.5 text-sm text-foreground"
                  />
                </div>
              </div>
            </div>
          )}

          {/* "All" tab — universal results */}
          {activeTab === "all" && (
            <UniversalResults
              results={universalResults}
              query={query}
              onTabSwitch={setActiveTab}
            />
          )}

          {/* "Posts" tab */}
          {activeTab === "posts" && (
            <PostSearchResults results={postResults} query={query} />
          )}

          {/* "Users" tab */}
          {activeTab === "users" && (
            <UserSearchResults results={userResults} query={query} />
          )}

          {/* "Hashtags" tab */}
          {activeTab === "hashtags" && (
            <HashtagSearchResults results={hashtagResults} query={query} />
          )}
        </>
      )}
    </div>
  )
}

// ── Sub-components ──

function UniversalResults({
  results,
  query,
  onTabSwitch,
}: {
  results: UniversalSearchResult | undefined | null
  query: string
  onTabSwitch: (tab: SearchTab) => void
}) {
  if (results === undefined || results === null) {
    return <SearchSkeleton />
  }

  const hasResults =
    results.users.length > 0 ||
    results.posts.length > 0 ||
    results.hashtags.length > 0

  if (!hasResults) {
    return <EmptyResults query={query} />
  }

  return (
    <div className="space-y-6">
      {/* Users section */}
      {results.users.length > 0 && (
        <section>
          <div className="flex items-center justify-between mb-3">
            <h3 className="flex items-center gap-2 text-sm font-semibold text-foreground">
              <Users className="h-4 w-4 text-primary" />
              Users
            </h3>
            <button
              onClick={() => onTabSwitch("users")}
              className="text-xs text-primary hover:underline"
            >
              See all results
            </button>
          </div>
          <div className="space-y-2">
            {results.users.map((user) => (
              <Link
                key={user._id}
                href={`/profile/${user.username || user._id}`}
                className="flex items-center gap-3 rounded-lg border border-border bg-card p-3 hover:bg-accent/50 transition-colors"
              >
                {user.profilePicture ? (
                  <Image
                    src={user.profilePicture}
                    alt={user.name}
                    width={36}
                    height={36}
                    className="rounded-full"
                  />
                ) : (
                  <div className="h-9 w-9 rounded-full bg-primary/10 flex items-center justify-center text-sm font-bold text-primary">
                    {user.name.charAt(0).toUpperCase()}
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground truncate">
                    <HighlightText text={user.name} query={query} />
                  </p>
                  <p className="text-xs text-muted-foreground truncate">
                    {user.username && `@${user.username} · `}
                    {user.role}
                    {user.university && ` · ${user.university}`}
                  </p>
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* Posts section */}
      {results.posts.length > 0 && (
        <section>
          <div className="flex items-center justify-between mb-3">
            <h3 className="flex items-center gap-2 text-sm font-semibold text-foreground">
              <FileText className="h-4 w-4 text-success" />
              Posts
            </h3>
            <button
              onClick={() => onTabSwitch("posts")}
              className="text-xs text-primary hover:underline"
            >
              See all results
            </button>
          </div>
          <div className="space-y-2">
            {results.posts.map((post) => (
              <Link
                key={post._id}
                href={`/post/${post._id}`}
                className="block rounded-lg border border-border bg-card p-3 hover:bg-accent/50 transition-colors"
              >
                {post.author && (
                  <div className="flex items-center gap-2 mb-1.5">
                    {post.author.profilePicture ? (
                      <Image
                        src={post.author.profilePicture}
                        alt={post.author.name}
                        width={20}
                        height={20}
                        className="rounded-full"
                      />
                    ) : (
                      <div className="h-5 w-5 rounded-full bg-primary/10 flex items-center justify-center text-[10px] font-bold text-primary">
                        {post.author.name.charAt(0).toUpperCase()}
                      </div>
                    )}
                    <span className="text-xs font-medium text-foreground">
                      {post.author.name}
                    </span>
                    <span className="text-[10px] text-muted-foreground ml-auto">
                      {formatTimeAgo(post.createdAt)}
                    </span>
                  </div>
                )}
                <p className="text-sm text-muted-foreground line-clamp-2">
                  <HighlightText text={post.content} query={query} />
                </p>
                <div className="flex items-center gap-3 mt-2 text-[10px] text-muted-foreground">
                  {post.likeCount > 0 && (
                    <span className="flex items-center gap-0.5">
                      <Heart className="h-3 w-3" /> {post.likeCount}
                    </span>
                  )}
                  {post.commentCount > 0 && (
                    <span className="flex items-center gap-0.5">
                      <MessageCircle className="h-3 w-3" /> {post.commentCount}
                    </span>
                  )}
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* Hashtags section */}
      {results.hashtags.length > 0 && (
        <section>
          <div className="flex items-center justify-between mb-3">
            <h3 className="flex items-center gap-2 text-sm font-semibold text-foreground">
              <Hash className="h-4 w-4 text-purple-500" />
              Hashtags
            </h3>
            <button
              onClick={() => onTabSwitch("hashtags")}
              className="text-xs text-primary hover:underline"
            >
              See all results
            </button>
          </div>
          <div className="flex flex-wrap gap-2">
            {results.hashtags.map((hashtag) => (
              <Link
                key={hashtag._id}
                href={`/hashtag/${hashtag.tag}`}
                className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-3 py-1 text-sm text-primary hover:bg-primary/20 transition-colors"
              >
                <Hash className="h-3 w-3" />
                <HighlightText text={hashtag.tag} query={query} />
                <span className="text-[10px] text-muted-foreground ml-1">
                  {hashtag.postCount} posts
                </span>
              </Link>
            ))}
          </div>
        </section>
      )}
    </div>
  )
}

function PostSearchResults({ results, query }: { results: PostSearchResult | undefined | null; query: string }) {
  if (results === undefined || results === null) return <SearchSkeleton />
  if (results.items.length === 0) return <EmptyResults query={query} />

  return (
    <div className="space-y-4">
      <p className="text-xs text-muted-foreground">
        {results.items.length} result{results.items.length !== 1 ? "s" : ""}
      </p>
      {results.items.map((item) => {
        if (!item.post || !item.post.author) return null
        return (
          <PostCard
            key={item._id}
            post={item.post}
            author={item.post.author}
          />
        )
      })}
      {results.hasMore && (
        <p className="text-center text-sm text-muted-foreground py-2">
          More results available. Try refining your search.
        </p>
      )}
    </div>
  )
}

function UserSearchResults({ results, query }: { results: UserSearchResult | undefined | null; query: string }) {
  if (results === undefined || results === null) return <SearchSkeleton />
  if (results.items.length === 0) return <EmptyResults query={query} />

  return (
    <div className="space-y-3">
      <p className="text-xs text-muted-foreground">
        {results.totalCount} result{results.totalCount !== 1 ? "s" : ""}
      </p>
      {results.items.map((user) => (
        <UserCard key={user._id} user={user} />
      ))}
      {results.hasMore && (
        <p className="text-center text-sm text-muted-foreground py-2">
          More results available. Try refining your search.
        </p>
      )}
    </div>
  )
}

function HashtagSearchResults({ results, query }: { results: HashtagSearchResult | undefined | null; query: string }) {
  if (results === undefined || results === null) return <SearchSkeleton />
  if (results.items.length === 0) return <EmptyResults query={query} />

  return (
    <div className="space-y-2">
      <p className="text-xs text-muted-foreground">
        {results.items.length} result{results.items.length !== 1 ? "s" : ""}
      </p>
      {results.items.map((hashtag) => (
        <Link
          key={hashtag._id}
          href={`/hashtag/${hashtag.tag}`}
          className="flex items-center justify-between rounded-lg border border-border bg-card p-3 hover:bg-accent/50 transition-colors"
        >
          <div className="flex items-center gap-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
              <Hash className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="text-sm font-medium text-foreground">
                #<HighlightText text={hashtag.tag} query={query} />
              </p>
              <p className="text-xs text-muted-foreground">
                {hashtag.postCount} {hashtag.postCount === 1 ? "post" : "posts"}
              </p>
            </div>
          </div>
        </Link>
      ))}
    </div>
  )
}

// ── Shared components ──

function SearchSkeleton() {
  return (
    <div className="space-y-4">
      {[...Array(5)].map((_, i) => (
        <div
          key={i}
          className="rounded-lg border border-border bg-card p-4"
        >
          <div className="flex items-center gap-3 mb-3">
            <div className="h-9 w-9 rounded-full bg-muted bg-muted animate-pulse" />
            <div className="flex-1 space-y-1">
              <div className="h-4 w-24 rounded bg-muted bg-muted animate-pulse" />
              <div className="h-3 w-16 rounded bg-muted bg-muted animate-pulse" />
            </div>
          </div>
          <div className="space-y-2">
            <div className="h-3 w-full rounded bg-muted bg-muted animate-pulse" />
            <div className="h-3 w-2/3 rounded bg-muted bg-muted animate-pulse" />
          </div>
        </div>
      ))}
    </div>
  )
}

function EmptyResults({ query }: { query: string }) {
  return (
    <div className="rounded-lg border border-border bg-card p-8 text-center sm:p-12">
      <Search className="mx-auto h-12 w-12 text-muted-foreground dark:text-muted-foreground mb-4" />
      <p className="text-base font-medium text-foreground sm:text-lg">
        No results for &ldquo;{query}&rdquo;
      </p>
      <p className="mt-1 text-sm text-muted-foreground sm:mt-2">
        Try different keywords or check for typos
      </p>
    </div>
  )
}

/**
 * Highlight matching text segments in search results.
 */
function HighlightText({ text, query }: { text: string; query: string }) {
  if (!query.trim()) return <>{text}</>

  const q = query.trim().toLowerCase()
  const idx = text.toLowerCase().indexOf(q)

  if (idx === -1) return <>{text}</>

  return (
    <>
      {text.slice(0, idx)}
      <mark className="bg-yellow-200 dark:bg-yellow-800/50 text-inherit rounded-sm px-0.5">
        {text.slice(idx, idx + q.length)}
      </mark>
      {text.slice(idx + q.length)}
    </>
  )
}

function formatTimeAgo(timestamp: number): string {
  const diff = Date.now() - timestamp
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return "now"
  if (mins < 60) return `${mins}m`
  const hours = Math.floor(mins / 60)
  if (hours < 24) return `${hours}h`
  const days = Math.floor(hours / 24)
  if (days < 7) return `${days}d`
  const weeks = Math.floor(days / 7)
  return `${weeks}w`
}
