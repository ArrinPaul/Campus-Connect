"use client"

import { useState, useRef, useEffect, useCallback } from "react"
import { useQuery } from "convex/react"
import { api } from "@/convex/_generated/api"
import { useRouter } from "next/navigation"
import Link from "next/link"
import Image from "next/image"
import { Search, X, Users, FileText, Hash, ArrowRight } from "lucide-react"

const RECENT_SEARCHES_KEY = "campus-connect-recent-searches"
const MAX_RECENT_SEARCHES = 10

export function UniversalSearchBar() {
  const router = useRouter()
  const [query, setQuery] = useState("")
  const [debouncedQuery, setDebouncedQuery] = useState("")
  const [isFocused, setIsFocused] = useState(false)
  const [recentSearches, setRecentSearches] = useState<string[]>([])
  const inputRef = useRef<HTMLInputElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  // Debounce the search query (300ms)
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(query.trim())
    }, 300)
    return () => clearTimeout(timer)
  }, [query])

  // Load recent searches from localStorage
  useEffect(() => {
    try {
      const saved = localStorage.getItem(RECENT_SEARCHES_KEY)
      if (saved) setRecentSearches(JSON.parse(saved))
    } catch {
      // Ignore localStorage errors
    }
  }, [])

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node)
      ) {
        setIsFocused(false)
      }
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  // Keyboard shortcut: Ctrl+K / Cmd+K to focus search
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if ((e.ctrlKey || e.metaKey) && e.key === "k") {
        e.preventDefault()
        inputRef.current?.focus()
        setIsFocused(true)
      }
      if (e.key === "Escape") {
        setIsFocused(false)
        inputRef.current?.blur()
      }
    }
    document.addEventListener("keydown", handleKeyDown)
    return () => document.removeEventListener("keydown", handleKeyDown)
  }, [])

  // Universal search query — fires only when user is typing with ≥2 chars
  const results = useQuery(
    api.search.universalSearch,
    debouncedQuery.length >= 2 ? { query: debouncedQuery, limit: 3 } : "skip"
  )

  const saveSearch = useCallback(
    (q: string) => {
      if (!q.trim()) return
      const updated = [q.trim(), ...recentSearches.filter((s) => s !== q.trim())].slice(
        0,
        MAX_RECENT_SEARCHES
      )
      setRecentSearches(updated)
      try {
        localStorage.setItem(RECENT_SEARCHES_KEY, JSON.stringify(updated))
      } catch {
        // Ignore
      }
    },
    [recentSearches]
  )

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!query.trim()) return
    saveSearch(query.trim())
    setIsFocused(false)
    router.push(`/search?q=${encodeURIComponent(query.trim())}`)
  }

  const handleRecentClick = (q: string) => {
    setQuery(q)
    saveSearch(q)
    setIsFocused(false)
    router.push(`/search?q=${encodeURIComponent(q)}`)
  }

  const showDropdown =
    isFocused && (debouncedQuery.length >= 2 || recentSearches.length > 0)

  const hasResults =
    results &&
    (results.users.length > 0 ||
      results.posts.length > 0 ||
      results.hashtags.length > 0)

  return (
    <div ref={containerRef} className="relative w-full max-w-md">
      <form onSubmit={handleSubmit} className="relative">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => setIsFocused(true)}
          placeholder="Search... (/ or Ctrl+K)"
          aria-label="Search"
          data-search-input
          className="h-9 w-full rounded-full border border-border bg-muted pl-9 pr-8 text-sm text-foreground placeholder:text-muted-foreground transition-colors focus:border-ring focus:bg-card focus:outline-none focus:ring-1 focus:ring-ring border-border bg-muted text-foreground dark:placeholder:text-muted-foreground dark:focus:border-blue-400 dark:focus:bg-muted"
        />
        {query && (
          <button
            type="button"
            onClick={() => {
              setQuery("")
              setDebouncedQuery("")
              inputRef.current?.focus()
            }}
            className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full p-0.5 text-muted-foreground hover:text-muted-foreground dark:hover:text-muted-foreground"
            aria-label="Clear search"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        )}
      </form>

      {/* Dropdown */}
      {showDropdown && (
        <div className="absolute left-0 right-0 top-full z-50 mt-1 max-h-[70vh] overflow-y-auto rounded-lg border border-border bg-card shadow-lg border-border bg-card">
          {/* Searching state */}
          {debouncedQuery.length >= 2 && !results && (
            <div className="flex items-center gap-2 px-4 py-3 text-sm text-muted-foreground">
              <div className="h-4 w-4 animate-spin rounded-full border-2 border-blue-500 border-t-transparent" />
              Searching...
            </div>
          )}

          {/* Results */}
          {debouncedQuery.length >= 2 && results && hasResults && (
            <div>
              {/* Users */}
              {results.users.length > 0 && (
                <div>
                  <div className="flex items-center gap-2 px-4 py-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    <Users className="h-3.5 w-3.5" />
                    People
                  </div>
                  {results.users.map((user: any) => (
                    <Link
                      key={user._id}
                      href={`/profile/${user._id}`}
                      onClick={() => {
                        saveSearch(query.trim())
                        setIsFocused(false)
                      }}
                      className="flex items-center gap-3 px-4 py-2 transition-colors hover:bg-accent"
                    >
                      <div className="relative h-8 w-8 shrink-0 overflow-hidden rounded-full bg-muted dark:bg-muted">
                        {user.imageUrl ? (
                          <Image
                            src={user.imageUrl}
                            alt={user.name}
                            fill
                            className="object-cover"
                          />
                        ) : (
                          <div className="flex h-full w-full items-center justify-center text-xs font-bold text-muted-foreground">
                            {user.name?.[0]?.toUpperCase() ?? "?"}
                          </div>
                        )}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium text-foreground">
                          {user.name}
                        </p>
                        {user.username && (
                          <p className="truncate text-xs text-muted-foreground">
                            @{user.username}
                          </p>
                        )}
                      </div>
                    </Link>
                  ))}
                </div>
              )}

              {/* Posts */}
              {results.posts.length > 0 && (
                <div>
                  <div className="flex items-center gap-2 border-t border-border px-4 py-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground border-border text-muted-foreground">
                    <FileText className="h-3.5 w-3.5" />
                    Posts
                  </div>
                  {results.posts.map((post: any) => (
                    <Link
                      key={post._id}
                      href={`/post/${post._id}`}
                      onClick={() => {
                        saveSearch(query.trim())
                        setIsFocused(false)
                      }}
                      className="block px-4 py-2 transition-colors hover:bg-accent"
                    >
                      <p className="truncate text-sm text-foreground">
                        {post.content?.slice(0, 100)}
                        {post.content?.length > 100 ? "..." : ""}
                      </p>
                      <p className="mt-0.5 text-xs text-muted-foreground">
                        by {post.authorName ?? "Unknown"}
                      </p>
                    </Link>
                  ))}
                </div>
              )}

              {/* Hashtags */}
              {results.hashtags.length > 0 && (
                <div>
                  <div className="flex items-center gap-2 border-t border-border px-4 py-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground border-border text-muted-foreground">
                    <Hash className="h-3.5 w-3.5" />
                    Hashtags
                  </div>
                  {results.hashtags.map((tag: any) => (
                    <Link
                      key={tag._id}
                      href={`/search?q=${encodeURIComponent("#" + tag.tag)}`}
                      onClick={() => {
                        saveSearch("#" + tag.tag)
                        setIsFocused(false)
                      }}
                      className="flex items-center justify-between px-4 py-2 transition-colors hover:bg-accent"
                    >
                      <span className="text-sm font-medium text-primary">
                        #{tag.tag}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {tag.postCount ?? 0} posts
                      </span>
                    </Link>
                  ))}
                </div>
              )}

              {/* See all results link */}
              <Link
                href={`/search?q=${encodeURIComponent(query.trim())}`}
                onClick={() => {
                  saveSearch(query.trim())
                  setIsFocused(false)
                }}
                className="flex items-center justify-center gap-1 border-t border-border px-4 py-2.5 text-sm font-medium text-primary transition-colors hover:bg-primary/10 border-border text-primary hover:bg-accent"
              >
                See all results
                <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </div>
          )}

          {/* No results */}
          {debouncedQuery.length >= 2 && results && !hasResults && (
            <div className="px-4 py-6 text-center text-sm text-muted-foreground">
              <Search className="mx-auto mb-2 h-6 w-6 opacity-40" />
              No results for &quot;{debouncedQuery}&quot;
            </div>
          )}

          {/* Recent searches (shown when no query or query < 2 chars) */}
          {debouncedQuery.length < 2 && recentSearches.length > 0 && (
            <div>
              <div className="flex items-center justify-between px-4 py-2">
                <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Recent Searches
                </span>
                <button
                  onClick={() => {
                    setRecentSearches([])
                    localStorage.removeItem(RECENT_SEARCHES_KEY)
                  }}
                  className="text-xs text-muted-foreground hover:text-muted-foreground dark:hover:text-muted-foreground"
                >
                  Clear all
                </button>
              </div>
              {recentSearches.slice(0, 5).map((s, i) => (
                <button
                  key={i}
                  onClick={() => handleRecentClick(s)}
                  className="flex w-full items-center gap-2 px-4 py-2 text-left text-sm text-foreground transition-colors hover:bg-muted/50 text-muted-foreground hover:bg-accent"
                >
                  <Search className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                  <span className="truncate">{s}</span>
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
