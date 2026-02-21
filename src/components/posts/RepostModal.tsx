"use client"

import { useState } from "react"
import { useMutation } from "convex/react"
import { api } from "@/convex/_generated/api"
import { Id } from "@/convex/_generated/dataModel"
import { X } from "lucide-react"
import { ButtonLoadingSpinner } from "@/components/ui/loading-skeleton"

interface Post {
  _id: Id<"posts">
  content: string
  authorId: Id<"users">
  createdAt: number
  author?: {
    _id: Id<"users">
    name: string
    profilePicture?: string
  }
}

interface RepostModalProps {
  post: Post
  isOpen: boolean
  onClose: () => void
  onSuccess?: () => void
}

/**
 * RepostModal component
 * Allows users to repost with an optional quote/comment
 * Features:
 * - Preview of original post
 * - Optional textarea for quote post (500 char limit)
 * - Plain repost or quote post options
 */
export function RepostModal({ post, isOpen, onClose, onSuccess }: RepostModalProps) {
  const createRepost = useMutation(api.reposts.createRepost)
  
  const [quoteContent, setQuoteContent] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState("")

  const maxLength = 500

  if (!isOpen) return null

  const handlePlainRepost = async () => {
    setError("")
    setIsSubmitting(true)

    try {
      await createRepost({
        originalPostId: post._id,
      })
      
      onClose()
      setQuoteContent("")
      
      if (onSuccess) {
        onSuccess()
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to repost")
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleQuotePost = async () => {
    setError("")

    if (quoteContent.trim().length === 0) {
      setError("Please add a comment for your quote post")
      return
    }

    if (quoteContent.length > maxLength) {
      setError(`Quote must not exceed ${maxLength} characters`)
      return
    }

    setIsSubmitting(true)

    try {
      await createRepost({
        originalPostId: post._id,
        quoteContent: quoteContent.trim(),
      })
      
      onClose()
      setQuoteContent("")
      
      if (onSuccess) {
        onSuccess()
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create quote post")
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleClose = () => {
    if (!isSubmitting) {
      onClose()
      setQuoteContent("")
      setError("")
    }
  }

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-foreground/20 backdrop-blur-sm z-40"
        onClick={handleClose}
      />

      {/* Modal */}
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div className="bg-card rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-auto">
          {/* Header */}
          <div className="sticky top-0 bg-card border-b border-border px-4 py-3 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-foreground">
              Repost
            </h2>
            <button
              onClick={handleClose}
              disabled={isSubmitting}
              className="p-2 rounded-full hover:bg-accent transition-colors disabled:opacity-50"
              aria-label="Close"
            >
              <X className="w-5 h-5 text-muted-foreground" />
            </button>
          </div>

          {/* Content */}
          <div className="p-4 space-y-4">
            {/* Quote textarea */}
            <div>
              <label htmlFor="quoteContent" className="block text-sm font-medium text-foreground mb-2">
                Add your thoughts (optional)
              </label>
              <textarea
                id="quoteContent"
                value={quoteContent}
                onChange={(e) => setQuoteContent(e.target.value)}
                rows={3}
                maxLength={maxLength}
                placeholder="What do you think about this?"
                className="block w-full rounded-md border border-border bg-card bg-muted px-3 py-2 text-foreground shadow-sm focus:border-ring focus:outline-none focus:ring-1 focus:ring-ring"
                disabled={isSubmitting}
              />
              <div className="mt-1 flex justify-between text-xs">
                <span className="text-destructive dark:text-red-400">{error}</span>
                <span className={`${quoteContent.length > maxLength ? "text-destructive dark:text-red-400" : "text-muted-foreground"}`}>
                  {quoteContent.length}/{maxLength}
                </span>
              </div>
            </div>

            {/* Original post preview */}
            <div className="border border-border rounded-lg p-4 bg-background">
              <div className="flex items-center gap-3 mb-3">
                {post.author?.profilePicture ? (
                  <img
                    src={post.author.profilePicture}
                    alt={post.author.name}
                    className="w-10 h-10 rounded-full object-cover"
                  />
                ) : (
                  <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center text-primary-foreground font-bold">
                    {post.author?.name.charAt(0).toUpperCase() || "?"}
                  </div>
                )}
                <div>
                  <p className="font-semibold text-foreground">
                    {post.author?.name || "Unknown User"}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {new Date(post.createdAt).toLocaleDateString()}
                  </p>
                </div>
              </div>
              <p className="text-foreground whitespace-pre-wrap">
                {post.content}
              </p>
            </div>
          </div>

          {/* Footer / Actions */}
          <div className="sticky bottom-0 bg-card border-t border-border px-4 py-3 flex items-center justify-end gap-3">
            <button
              onClick={handleClose}
              disabled={isSubmitting}
              className="px-4 py-2 text-sm font-medium text-foreground hover:bg-accent rounded-md transition-colors disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              onClick={handlePlainRepost}
              disabled={isSubmitting}
              className="px-4 py-2 text-sm font-medium text-foreground bg-muted hover:bg-muted dark:hover:bg-muted rounded-md transition-colors disabled:opacity-50 flex items-center gap-2"
            >
              {isSubmitting && !quoteContent && <ButtonLoadingSpinner />}
              Repost
            </button>
            <button
              onClick={handleQuotePost}
              disabled={isSubmitting || quoteContent.trim().length === 0}
              className="px-4 py-2 text-sm font-medium text-primary-foreground bg-primary hover:bg-primary/90 rounded-md transition-colors disabled:opacity-50 flex items-center gap-2"
            >
              {isSubmitting && quoteContent && <ButtonLoadingSpinner />}
              Quote Post
            </button>
          </div>
        </div>
      </div>
    </>
  )
}
