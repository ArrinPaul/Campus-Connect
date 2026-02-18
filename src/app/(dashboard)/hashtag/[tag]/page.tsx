"use client"

import { useState, useEffect, useCallback, useRef } from "react"
import { useParams } from "next/navigation"
import { useQuery } from "convex/react"
import { api } from "@/convex/_generated/api"
import { PostCard } from "@/components/posts/PostCard"
import { Loader2, Hash } from "lucide-react"
import { getHashtagDisplay } from "../../../../../lib/hashtag-utils"

export default function HashtagPage() {
  const params = useParams()
  const tag = typeof params?.tag === "string" ? decodeURIComponent(params.tag) : ""

  // Pagination state
  const [allPosts, setAllPosts] = useState<any[]>([])
  const [paginationCursor, setPaginationCursor] = useState<string | null>(null)
  const [isLoadingMore, setIsLoadingMore] = useState(false)
  const hasInitialized = useRef(false)
  const prevTag = useRef(tag)

  // Get initial page of posts
  const result = useQuery(
    api.hashtags.getPostsByHashtag,
    tag ? { tag, limit: 20 } : "skip"
  )

  // Get more posts when cursor is set
  const morePostsResult = useQuery(
    api.hashtags.getPostsByHashtag,
    isLoadingMore && paginationCursor && tag
      ? { tag, limit: 20, cursor: paginationCursor }
      : "skip"
  )

  // Get hashtag stats
  const hashtagStats = useQuery(
    api.hashtags.getHashtagStats,
    tag ? { tag } : "skip"
  )

  // Reset when tag changes
  useEffect(() => {
    if (tag !== prevTag.current) {
      prevTag.current = tag
      hasInitialized.current = false
      setAllPosts([])
      setPaginationCursor(null)
      setIsLoadingMore(false)
    }
  }, [tag])

  // Initialize from first result
  useEffect(() => {
    if (result && !hasInitialized.current) {
      hasInitialized.current = true
      setAllPosts(result.posts || [])
      setPaginationCursor(result.cursor || null)
    }
  }, [result])

  // Append more results
  useEffect(() => {
    if (morePostsResult && isLoadingMore) {
      setAllPosts(prev => [...prev, ...(morePostsResult.posts || [])])
      setPaginationCursor(morePostsResult.cursor || null)
      setIsLoadingMore(false)
    }
  }, [morePostsResult, isLoadingMore])

  const handleLoadMore = useCallback(() => {
    if (paginationCursor && !isLoadingMore) {
      setIsLoadingMore(true)
    }
  }, [paginationCursor, isLoadingMore])

  const posts = allPosts
  const hashtag = result?.hashtag || hashtagStats
  const isLoading = result === undefined && !hasInitialized.current

  if (!tag) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <div className="max-w-4xl mx-auto px-4 py-6 sm:px-6 lg:px-8">
          <div className="flex flex-col items-center justify-center py-12 gap-4">
            <Hash className="w-16 h-16 text-gray-400" />
            <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
              Invalid hashtag
            </h2>
            <p className="text-gray-600 dark:text-gray-400">
              Please provide a valid hashtag
            </p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-4xl mx-auto px-4 py-6 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-12 h-12 rounded-full bg-blue-600 text-white">
              <Hash className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-gray-100">
                {getHashtagDisplay(tag)}
              </h1>
              {hashtag && (
                <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
                  {hashtag.postCount.toLocaleString()} {hashtag.postCount === 1 ? "post" : "posts"}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Loading State */}
        {isLoading && (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
          </div>
        )}

        {/* Empty State */}
        {!isLoading && posts.length === 0 && (
          <div className="flex flex-col items-center justify-center py-12 gap-4">
            <div className="relative">
              <Hash className="w-20 h-20 text-gray-300 dark:text-gray-600" />
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-12 h-12 border-2 border-gray-300 dark:border-gray-600 rounded-full opacity-50" />
              </div>
            </div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
              No posts found
            </h3>
            <p className="text-gray-600 dark:text-gray-400 text-center max-w-md">
              Be the first to post with {getHashtagDisplay(tag)}!
            </p>
          </div>
        )}

        {/* Posts Feed */}
        {!isLoading && posts.length > 0 && (
          <div className="space-y-4">
            {posts.map((postData) => {
              if (!postData.author) return null

              return (
                <PostCard
                  key={postData._id}
                  post={{
                    _id: postData._id,
                    authorId: postData.authorId,
                    content: postData.content,
                    likeCount: postData.likeCount,
                    commentCount: postData.commentCount,
                    shareCount: postData.shareCount || 0,
                    createdAt: postData.createdAt,
                    updatedAt: postData.updatedAt,
                  }}
                  author={{
                    _id: postData.author._id,
                    name: postData.author.name,
                    profilePicture: postData.author.profilePicture,
                    role: postData.author.role as "Student" | "Research Scholar" | "Faculty",
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
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 flex items-center gap-2"
            >
              {isLoadingMore && <Loader2 className="w-4 h-4 animate-spin" />}
              {isLoadingMore ? "Loading..." : "Load More"}
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
