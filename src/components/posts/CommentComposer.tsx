"use client"

import { useState } from "react"
import { useMutation } from "convex/react"
import { api } from "@/convex/_generated/api"
import { Id } from "@/convex/_generated/dataModel"
import { ButtonLoadingSpinner } from "@/components/ui/loading-skeleton"

interface CommentComposerProps {
  postId: Id<"posts">
  onCommentAdded?: () => void
}

export function CommentComposer({ postId, onCommentAdded }: CommentComposerProps) {
  const createComment = useMutation(api.comments.createComment)

  const [content, setContent] = useState("")
  const [error, setError] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)

  const maxLength = 1000

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")

    // Client-side validation
    if (!content || content.trim().length === 0) {
      setError("Comment cannot be empty")
      return
    }

    if (content.length > maxLength) {
      setError(`Comment must not exceed ${maxLength} characters`)
      return
    }

    setIsSubmitting(true)

    try {
      await createComment({ postId, content })
      
      // Clear input after successful comment
      setContent("")
      
      if (onCommentAdded) {
        onCommentAdded()
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create comment")
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <div>
        <label htmlFor={`comment-${postId}`} className="sr-only">
          Add a comment
        </label>
        <textarea
          id={`comment-${postId}`}
          value={content}
          onChange={(e) => setContent(e.target.value)}
          rows={2}
          maxLength={maxLength}
          className="block w-full rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-3 py-2 text-sm text-gray-900 dark:text-gray-100 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          placeholder="Write a comment..."
        />
        <div className="mt-1 flex justify-between text-xs">
          <span className="text-red-600 dark:text-red-400">{error}</span>
          <span className={`${content.length > maxLength ? "text-red-600 dark:text-red-400" : "text-gray-500 dark:text-gray-400"}`}>
            {content.length}/{maxLength}
          </span>
        </div>
      </div>

      <div className="flex justify-end">
        <button
          type="submit"
          disabled={isSubmitting || content.trim().length === 0}
          className="rounded-md bg-blue-600 px-4 py-2 text-sm text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 flex items-center gap-2"
        >
          {isSubmitting && <ButtonLoadingSpinner />}
          {isSubmitting ? "Posting..." : "Comment"}
        </button>
      </div>
    </form>
  )
}
