"use client"

import { useState } from "react"
import { useMutation } from "convex/react"
import { api } from "@/convex/_generated/api"
import { Id } from "@/convex/_generated/dataModel"
import { ButtonLoadingSpinner } from "@/components/ui/loading-skeleton"
import { CompactRichTextEditor } from "@/components/editor/RichTextEditor"

interface CommentComposerProps {
  postId: Id<"posts">
  parentCommentId?: Id<"comments">
  replyingToName?: string
  onCommentAdded?: () => void
  onCancel?: () => void
}

export function CommentComposer({
  postId,
  parentCommentId,
  replyingToName,
  onCommentAdded,
  onCancel,
}: CommentComposerProps) {
  const createComment = useMutation(api.comments.createComment)

  const [content, setContent] = useState("")
  const [error, setError] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)

  const maxLength = 1000

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")

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
      await createComment({ postId, content, ...(parentCommentId ? { parentCommentId } : {}) })
      setContent("")
      onCommentAdded?.()
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create comment")
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      {replyingToName && (
        <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
          <span>
            Replying to{" "}
            <span className="font-medium text-blue-600 dark:text-blue-400">
              @{replyingToName}
            </span>
          </span>
          {onCancel && (
            <button
              type="button"
              onClick={onCancel}
              className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
            >
              ✕ Cancel
            </button>
          )}
        </div>
      )}

      <CompactRichTextEditor
        value={content}
        onChange={setContent}
        placeholder={replyingToName ? `Reply to @${replyingToName}…` : "Write a comment… (supports **markdown**)"}
        maxLength={maxLength}
        disabled={isSubmitting}
      />

      {error && (
        <p className="text-xs text-red-600 dark:text-red-400">{error}</p>
      )}

      <div className="flex justify-end gap-2">
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            className="rounded-md border border-gray-300 dark:border-gray-600 px-4 py-2 text-sm text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
          >
            Cancel
          </button>
        )}
        <button
          type="submit"
          disabled={isSubmitting || content.trim().length === 0}
          className="rounded-md bg-blue-600 px-4 py-2 text-sm text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 flex items-center gap-2"
        >
          {isSubmitting && <ButtonLoadingSpinner />}
          {isSubmitting ? "Posting..." : replyingToName ? "Post Reply" : "Comment"}
        </button>
      </div>
    </form>
  )
}
