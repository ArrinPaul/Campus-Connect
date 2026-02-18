"use client"

import { useState, useCallback, useEffect, useRef } from "react"
import { useUser } from "@clerk/nextjs"
import { useQuery } from "convex/react"
import { api } from "@/convex/_generated/api"
import { PostCard } from "@/components/posts/PostCard"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Loader2, Bookmark } from "lucide-react"
import { Id } from "@/convex/_generated/dataModel"

export default function BookmarksPage() {
  const { isLoaded, isSignedIn } = useUser()
  const [selectedCollection, setSelectedCollection] = useState<string>("All")
  const [allBookmarks, setAllBookmarks] = useState<any[]>([])
  const [paginationCursor, setPaginationCursor] = useState<string | undefined>(undefined)
  const [isLoadingMore, setIsLoadingMore] = useState(false)
  const hasInitializedRef = useRef(false)
  const prevCollectionRef = useRef(selectedCollection)

  // Get user's collections
  const collections = useQuery(
    api.bookmarks.getCollections,
    isLoaded && isSignedIn ? {} : "skip"
  )

  // Get bookmarked posts (initial page)
  const bookmarksResult = useQuery(
    api.bookmarks.getBookmarks,
    isLoaded && isSignedIn
      ? {
          collectionName: selectedCollection === "All" ? undefined : selectedCollection,
          limit: 20,
          cursor: undefined
        }
      : "skip"
  )

  // Get more bookmarks when loading more
  const moreBookmarksResult = useQuery(
    api.bookmarks.getBookmarks,
    isLoaded && isSignedIn && isLoadingMore && paginationCursor
      ? {
          collectionName: selectedCollection === "All" ? undefined : selectedCollection,
          limit: 20,
          cursor: paginationCursor
        }
      : "skip"
  )

  // Reset when collection changes
  useEffect(() => {
    if (prevCollectionRef.current !== selectedCollection) {
      setAllBookmarks([])
      setPaginationCursor(undefined)
      setIsLoadingMore(false)
      hasInitializedRef.current = false
      prevCollectionRef.current = selectedCollection
    }
  }, [selectedCollection])

  // Initialize from first page result
  useEffect(() => {
    if (bookmarksResult && !hasInitializedRef.current) {
      setAllBookmarks(bookmarksResult.bookmarks)
      setPaginationCursor(bookmarksResult.cursor ?? undefined)
      hasInitializedRef.current = true
    }
  }, [bookmarksResult])

  // Append more results
  useEffect(() => {
    if (moreBookmarksResult && isLoadingMore) {
      setAllBookmarks((prev) => [...prev, ...moreBookmarksResult.bookmarks])
      setPaginationCursor(moreBookmarksResult.cursor ?? undefined)
      setIsLoadingMore(false)
    }
  }, [moreBookmarksResult, isLoadingMore])

  const handleLoadMore = useCallback(() => {
    if (!isLoadingMore && paginationCursor) {
      setIsLoadingMore(true)
    }
  }, [isLoadingMore, paginationCursor])

  if (!isLoaded) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    )
  }

  if (!isSignedIn) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen gap-4">
        <Bookmark className="w-16 h-16 text-gray-400" />
        <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
          Sign in to view your bookmarks
        </h2>
        <p className="text-gray-600 dark:text-gray-400">
          Bookmark posts to save them for later
        </p>
      </div>
    )
  }

  const collectionsData = collections || []
  const bookmarks = allBookmarks
  const isLoading = collections === undefined || bookmarksResult === undefined

  // Calculate total bookmarks for "All" tab
  const totalBookmarks = collectionsData.reduce((sum, col) => sum + col.count, 0)

  // Add "All" to the beginning of collections
  const allCollections = [
    { name: "All", count: totalBookmarks },
    ...collectionsData
  ]

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-4xl mx-auto px-4 py-6 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-gray-100 flex items-center gap-2">
            <Bookmark className="w-6 h-6 sm:w-8 sm:h-8" />
            Bookmarks
          </h1>
          <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
            Posts you&apos;ve saved for later
          </p>
        </div>

        {/* Collections Tabs */}
        {!isLoading && allCollections.length > 0 && (
          <Tabs value={selectedCollection} onValueChange={setSelectedCollection} className="mb-6">
            <TabsList className="w-full sm:w-auto overflow-x-auto flex-nowrap">
              {allCollections.map((collection) => (
                <TabsTrigger
                  key={collection.name}
                  value={collection.name}
                  className="whitespace-nowrap"
                >
                  {collection.name}
                  <span className="ml-2 text-xs bg-gray-200 dark:bg-gray-700 px-2 py-0.5 rounded-full">
                    {collection.count}
                  </span>
                </TabsTrigger>
              ))}
            </TabsList>
          </Tabs>
        )}

        {/* Loading State */}
        {isLoading && (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
          </div>
        )}

        {/* Empty State */}
        {!isLoading && bookmarks.length === 0 && (
          <div className="flex flex-col items-center justify-center py-12 gap-4">
            <div className="relative">
              <Bookmark className="w-20 h-20 text-gray-300 dark:text-gray-600" />
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-12 h-12 border-2 border-gray-300 dark:border-gray-600 rounded-full opacity-50" />
              </div>
            </div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
              No bookmarks yet
            </h3>
            <p className="text-gray-600 dark:text-gray-400 text-center max-w-md">
              {selectedCollection === "All"
                ? "Start bookmarking posts to save them for later. Click the bookmark icon on any post."
                : `No posts in "${selectedCollection}" collection yet.`}
            </p>
          </div>
        )}

        {/* Bookmarks Grid */}
        {!isLoading && bookmarks.length > 0 && (
          <div className="space-y-4">
            {bookmarks.map((bookmark) => {
              // Type guard to ensure we have valid data
              if (!bookmark.post || !bookmark.author) {
                return null
              }

              return (
                <PostCard
                  key={bookmark._id}
                  post={{
                    _id: bookmark.post._id,
                    authorId: bookmark.post.authorId,
                    content: bookmark.post.content,
                    likeCount: bookmark.post.likeCount,
                    commentCount: bookmark.post.commentCount,
                    shareCount: bookmark.post.shareCount || 0,
                    createdAt: bookmark.post.createdAt,
                    updatedAt: bookmark.post.updatedAt,
                  }}
                  author={{
                    _id: bookmark.author._id,
                    name: bookmark.author.name,
                    profilePicture: bookmark.author.profilePicture,
                    role: bookmark.author.role as "Student" | "Research Scholar" | "Faculty",
                  }}
                />
              )
            })}
          </div>
        )}

        {/* Load More Button */}
        {!isLoading && paginationCursor && (
          <div className="mt-6 flex justify-center">
            <button
              onClick={handleLoadMore}
              disabled={isLoadingMore}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoadingMore ? (
                <span className="flex items-center gap-2">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Loading...
                </span>
              ) : (
                "Load More"
              )}
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
