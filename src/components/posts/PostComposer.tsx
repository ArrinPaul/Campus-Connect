"use client"

import { useState } from "react"
import { useMutation } from "convex/react"
import { api } from "@/convex/_generated/api"
import { ButtonLoadingSpinner } from "@/components/ui/loading-skeleton"

interface PostComposerProps {
  onPostCreated?: () => void
}

export function PostComposer({ onPostCreated }: PostComposerProps) {
  const createPost = useMutation(api.posts.createPost)

  const [content, setContent] = useState("")
  const [error, setError] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)

  const maxLength = 5000

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")

    // Client-side validation
    if (!content || content.trim().length === 0) {
      setError("Post content cannot be empty")
      return
    }

    if (content.length > maxLength) {
      setError(`Post content must not exceed ${maxLength} characters`)
      return
    }

    setIsSubmitting(true)

    try {
      await createPost({ content })
      
      // Clear form after successful post
      setContent("")
      
      if (onPostCreated) {
        onPostCreated()
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create post")
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3 sm:space-y-4">
      <div>
        <label htmlFor="postContent" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
          What's on your mind?
        </label>
        <textarea
          id="postContent"
          value={content}
          onChange={(e) => setContent(e.target.value)}
          rows={4}
          maxLength={maxLength}
          className="mt-1 block w-full rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-3 py-2 text-gray-900 dark:text-gray-100 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          placeholder="Share your thoughts, ideas, or updates..."
        />
        <div className="mt-1 flex justify-between text-xs sm:text-sm">
          <span className="text-red-600 dark:text-red-400">{error}</span>
          <span className={`${content.length > maxLength ? "text-red-600 dark:text-red-400" : "text-gray-500 dark:text-gray-400"}`}>
            {content.length}/{maxLength}
          </span>
        </div>
      </div>

      <div>
        <button
          type="submit"
          disabled={isSubmitting || content.trim().length === 0}
          className="w-full rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 sm:text-base flex items-center justify-center gap-2"
          style={{ minHeight: "44px" }}
        >
          {isSubmitting && <ButtonLoadingSpinner />}
          {isSubmitting ? "Posting..." : "Post"}
        </button>
      </div>
    </form>
  )
}
