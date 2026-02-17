"use client"

import Link from "next/link"
import { useQuery } from "convex/react"
import { api } from "@/convex/_generated/api"
import { TrendingUp, Hash } from "lucide-react"
import { getHashtagDisplay } from "../../../lib/hashtag-utils"

interface TrendingHashtagsProps {
  limit?: number
  showHeader?: boolean
  className?: string
}

export function TrendingHashtags({
  limit = 10,
  showHeader = true,
  className = "",
}: TrendingHashtagsProps) {
  const trendingHashtags = useQuery(api.hashtags.getTrending, { limit })

  if (!trendingHashtags || trendingHashtags.length === 0) {
    return null
  }

  return (
    <div className={`rounded-lg bg-white dark:bg-gray-800 p-4 shadow dark:shadow-gray-900/50 ${className}`}>
      {showHeader && (
        <div className="flex items-center gap-2 mb-4">
          <TrendingUp className="w-5 h-5 text-blue-600 dark:text-blue-400" />
          <h2 className="text-lg font-bold text-gray-900 dark:text-gray-100">
            Trending Hashtags
          </h2>
        </div>
      )}

      <div className="space-y-3">
        {trendingHashtags.map((hashtag, index) => (
          <Link
            key={hashtag._id}
            href={`/hashtag/${hashtag.tag}`}
            className="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors group"
          >
            {/* Rank */}
            <div className="flex items-center justify-center w-6 h-6 text-xs font-bold text-gray-500 dark:text-gray-400">
              {index + 1}
            </div>

            {/* Icon */}
            <div className="flex items-center justify-center w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 group-hover:bg-blue-200 dark:group-hover:bg-blue-900/50 transition-colors">
              <Hash className="w-4 h-4" />
            </div>

            {/* Hashtag Info */}
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-gray-900 dark:text-gray-100 truncate group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                {getHashtagDisplay(hashtag.tag)}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                {hashtag.postCount.toLocaleString()} {hashtag.postCount === 1 ? "post" : "posts"}
              </p>
            </div>

            {/* Trending Indicator */}
            {index < 3 && (
              <TrendingUp className="w-4 h-4 text-green-600 dark:text-green-400" />
            )}
          </Link>
        ))}
      </div>

      {/* View All Link */}
      {trendingHashtags.length >= limit && (
        <div className="mt-4 pt-4 border-t dark:border-gray-700">
          <Link
            href="/discover?tab=trending"
            className="block text-center text-sm text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 font-medium"
          >
            View all trending topics →
          </Link>
        </div>
      )}
    </div>
  )
}
