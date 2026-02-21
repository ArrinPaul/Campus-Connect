"use client"

import { useState } from "react"
import { useMutation } from "convex/react"
import { api } from "@/convex/_generated/api"
import { Id } from "@/convex/_generated/dataModel"
import dynamic from "next/dynamic"import { ButtonLoadingSpinner } from "@/components/ui/loading-skeleton"
import { toast } from "sonner"

// Lazy load the heavy Tiptap editor
const CompactRichTextEditor = dynamic(
  () =>
    import("@/components/editor/RichTextEditor").then(
      (m) => m.CompactRichTextEditor
    ),
  {
    loading: () => (
      <div className="h-20 animate-pulse rounded-lg bg-muted" />
    ),
    ssr: false,
  }
)

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
      toast.success(replyingToName ? "Reply posted" : "Comment posted")
      onCommentAdded?.()
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Failed to post comment"
      setError(errorMessage)
      toast.error(errorMessage)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      {replyingToName && (
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span>
            Replying to{" "}
            <span className="font-medium text-primary">
              @{replyingToName}
            </span>
          </span>
          {onCancel && (
            <button
              type="button"
              onClick={onCancel}
              className="text-muted-foreground hover:text-muted-foreground hover:text-foreground"
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
        <p className="text-xs text-destructive dark:text-red-400">{error}</p>
      )}

      <div className="flex justify-end gap-2">
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            className="rounded-md border border-border px-4 py-2 text-sm text-muted-foreground hover:bg-accent"
          >
            Cancel
          </button>
        )}
        <button
          type="submit"
          disabled={isSubmitting || content.trim().length === 0}
          className="rounded-md bg-primary px-4 py-2 text-sm text-primary-foreground hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:opacity-50 flex items-center gap-2"
        >
          {isSubmitting && <ButtonLoadingSpinner />}
          {isSubmitting ? "Posting..." : replyingToName ? "Post Reply" : "Comment"}
        </button>
      </div>
    </form>
  )
}
