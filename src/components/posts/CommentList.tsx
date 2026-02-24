"use client"

import { useState, useMemo } from "react"
import Link from "next/link"
import { useUser } from "@clerk/nextjs"
import { useMutation, useQuery } from "convex/react"
import { api } from "@/convex/_generated/api"
import { Id } from "@/convex/_generated/dataModel"
import { CommentSkeleton } from "@/components/ui/loading-skeleton"
import { OptimizedImage } from "@/components/ui/OptimizedImage"
import { parseMentions } from "@/lib/mention-utils"
import { ChevronDown, ChevronUp, MessageSquare, ArrowRight } from "lucide-react"
import dynamic from "next/dynamic"
import { ButtonLoadingSpinner } from "@/components/ui/loading-skeleton"
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

interface User {
  _id: Id<"users">
  name: string
  profilePicture?: string
  role: "Student" | "Research Scholar" | "Faculty"
}

interface Comment {
  _id: Id<"comments">
  postId: Id<"posts">
  authorId: Id<"users">
  content: string
  createdAt: number
  parentCommentId?: Id<"comments">
  depth?: number
  replyCount?: number
  author: User | null
}

type SortOption = "old" | "new" | "best" | "controversial"

interface CommentListProps {
  postId: Id<"posts">
  comments: Comment[] | undefined
  isLoading?: boolean
  sortBy?: SortOption
  onSortChange?: (sort: SortOption) => void
  hasMore?: boolean
  isLoadingMore?: boolean
  onLoadMore?: () => void
}

const MAX_INDENT_DEPTH = 5
const INDENT_PX = 24

export function CommentList({
  postId,
  comments,
  isLoading = false,
  sortBy = "old",
  onSortChange,
  hasMore = false,
  isLoadingMore = false,
  onLoadMore,
}: CommentListProps) {
  const { isLoaded, isSignedIn } = useUser()
  const deleteComment = useMutation(api.comments.deleteComment)
  const createComment = useMutation(api.comments.createComment)
  const currentUser = useQuery(
    api.users.getCurrentUser,
    isLoaded && isSignedIn ? {} : "skip"
  )
  const [deletingId, setDeletingId] = useState<Id<"comments"> | null>(null)
  const [replyingTo, setReplyingTo] = useState<Id<"comments"> | null>(null)
  const [replyContent, setReplyContent] = useState("")
  const [replyError, setReplyError] = useState("")
  const [isSubmittingReply, setIsSubmittingReply] = useState(false)
  // Track which comment threads are collapsed
  const [collapsed, setCollapsed] = useState<Set<Id<"comments">>>(new Set())

  const formatTimestamp = (timestamp: number) => {
    const date = new Date(timestamp)
    const now = new Date()
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000)
    if (diffInSeconds < 60) return "just now"
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`
    if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)}d ago`
    return date.toLocaleDateString()
  }

  const toggleCollapse = (commentId: Id<"comments">) => {
    setCollapsed((prev) => {
      const next = new Set(prev)
      if (next.has(commentId)) next.delete(commentId)
      else next.add(commentId)
      return next
    })
  }

  const handleDelete = async (commentId: Id<"comments">) => {
    try {
      setDeletingId(commentId)
      await deleteComment({ commentId })
      toast.success("Comment deleted")
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to delete comment")
    } finally {
      setDeletingId(null)
    }
  }

  const handleReplySubmit = async (parentId: Id<"comments">) => {
    if (!replyContent.trim()) {
      setReplyError("Reply cannot be empty")
      return
    }
    if (replyContent.length > 1000) {
      setReplyError("Reply must not exceed 1000 characters")
      return
    }
    setIsSubmittingReply(true)
    setReplyError("")
    try {
      await createComment({ postId, content: replyContent, parentCommentId: parentId })
      setReplyContent("")
      toast.success("Reply posted")
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Failed to post reply"
      setReplyError(errorMessage)
      toast.error(errorMessage)
    } finally {
      setIsSubmittingReply(false)
    }
  }

  // Build a map: commentId → direct children
  const childrenMap = useMemo(() => {
    const map = new Map<Id<"comments">, Comment[]>()
    if (!comments) return map
    for (const c of comments) {
      if (c.parentCommentId) {
        const arr = map.get(c.parentCommentId) ?? []
        arr.push(c)
        map.set(c.parentCommentId, arr)
      }
    }
    return map
  }, [comments])

  // Get top-level comments (no parent)
  const topLevelComments = useMemo(
    () => (comments ?? []).filter((c) => !c.parentCommentId),
    [comments]
  )

  // Check if any ancestor of a comment is collapsed
  const isHiddenByCollapse = (comment: Comment): boolean => {
    if (!comment.parentCommentId) return false
    if (collapsed.has(comment.parentCommentId)) return true
    const parent = (comments ?? []).find((c) => c._id === comment.parentCommentId)
    if (!parent) return false
    return isHiddenByCollapse(parent)
  }

  const renderComment = (comment: Comment): React.ReactNode => {
    const depth = comment.depth ?? 0
    const replyCount = comment.replyCount ?? 0
    const indentPx = Math.min(depth, MAX_INDENT_DEPTH) * INDENT_PX
    const isCollapsed = collapsed.has(comment._id)
    const children = childrenMap.get(comment._id) ?? []
    const isAtMaxDepth = depth >= MAX_INDENT_DEPTH

    return (
      <div key={comment._id} style={{ marginLeft: `${indentPx}px` }} className="border-l border-border pl-3 mt-3 first:mt-0 first:border-l-0 first:pl-0">
        <div className="flex gap-3">
          {/* Author Avatar */}
          <div className="relative h-7 w-7 flex-shrink-0">
            {comment.author?.profilePicture ? (
              <OptimizedImage
                src={comment.author.profilePicture}
                alt={comment.author.name}
                fill
                isAvatar
                className="rounded-full object-cover"
              />
            ) : (
              <div className="flex h-7 w-7 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground">
                {comment.author?.name.charAt(0).toUpperCase() || "?"}
              </div>
            )}
          </div>

          {/* Comment body */}
          <div className="flex-1 min-w-0">
            <div className="rounded-lg bg-muted px-3 py-2">
              <div className="flex items-center justify-between gap-2 flex-wrap">
                <p className="text-sm font-semibold text-foreground">
                  {comment.author?.name || "Unknown User"}
                </p>
                <span className="text-xs text-muted-foreground whitespace-nowrap">
                  {formatTimestamp(comment.createdAt)}
                </span>
              </div>
              <p className="mt-1 whitespace-pre-wrap text-sm text-foreground break-words">
                {parseMentions(comment.content).map((segment, index) => {
                  if (segment.type === "mention") {
                    return (
                      <Link
                        key={index}
                        href={`/profile/${segment.content}`}
                        className="text-primary hover:text-primary text-primary dark:hover:text-blue-300 font-medium hover:underline"
                        onClick={(e) => e.stopPropagation()}
                      >
                        @{segment.content}
                      </Link>
                    )
                  }
                  return <span key={index}>{segment.content}</span>
                })}
              </p>
            </div>

            {/* Action row */}
            <div className="flex items-center gap-3 mt-1 flex-wrap">
              {/* Reply button (only if not at max depth) */}
              {isSignedIn && !isAtMaxDepth && (
                <button
                  onClick={() => {
                    setReplyingTo(replyingTo === comment._id ? null : comment._id)
                    setReplyContent("")
                    setReplyError("")
                  }}
                  className="text-xs text-primary hover:text-primary text-primary dark:hover:text-blue-300 flex items-center gap-1"
                >
                  <MessageSquare className="h-3 w-3" />
                  Reply
                </button>
              )}
              {/* "Continue thread" at max depth */}
              {isAtMaxDepth && replyCount > 0 && (
                <Link
                  href={`#comment-${comment._id}`}
                  className="text-xs text-accent-violet hover:text-accent-violet/80 flex items-center gap-1"
                >
                  <ArrowRight className="h-3 w-3" />
                  Continue this thread
                </Link>
              )}
              {/* Collapse/expand toggle */}
              {replyCount > 0 && (
                <button
                  onClick={() => toggleCollapse(comment._id)}
                  className="text-xs text-muted-foreground hover:text-foreground text-muted-foreground hover:text-foreground flex items-center gap-1"
                >
                  {isCollapsed ? (
                    <>
                      <ChevronDown className="h-3 w-3" />
                      View {replyCount} {replyCount === 1 ? "reply" : "replies"}
                    </>
                  ) : (
                    <>
                      <ChevronUp className="h-3 w-3" />
                      Hide {replyCount === 1 ? "reply" : "replies"}
                    </>
                  )}
                </button>
              )}
              {/* Delete button */}
              {currentUser && currentUser._id === comment.authorId && (
                <button
                  onClick={() => handleDelete(comment._id)}
                  disabled={deletingId === comment._id}
                  className="text-xs text-destructive hover:text-destructive/80 disabled:opacity-50"
                >
                  {deletingId === comment._id ? "Deleting…" : "Delete"}
                </button>
              )}
            </div>

            {/* Inline reply composer */}
            {replyingTo === comment._id && (
              <div className="mt-2 space-y-2">
                <p className="text-xs text-muted-foreground">
                  Replying to{" "}
                  <span className="font-medium text-primary">
                    @{comment.author?.name || "user"}
                  </span>{" "}
                  <button
                    onClick={() => { setReplyingTo(null); setReplyContent(""); setReplyError("") }}
                    className="ml-1 text-muted-foreground hover:text-muted-foreground hover:text-foreground"
                  >
                    ✕ Cancel
                  </button>
                </p>
                <CompactRichTextEditor
                  value={replyContent}
                  onChange={setReplyContent}
                  placeholder="Write a reply…"
                  maxLength={1000}
                  disabled={isSubmittingReply}
                />
                {replyError && (
                  <p className="text-xs text-destructive">{replyError}</p>
                )}
                <div className="flex justify-end">
                  <button
                    onClick={() => handleReplySubmit(comment._id)}
                    disabled={isSubmittingReply || !replyContent.trim()}
                    className="rounded-md bg-primary px-3 py-1.5 text-xs text-primary-foreground hover:bg-primary/90 disabled:opacity-50 flex items-center gap-1"
                  >
                    {isSubmittingReply && <ButtonLoadingSpinner />}
                    {isSubmittingReply ? "Posting…" : "Post Reply"}
                  </button>
                </div>
              </div>
            )}

            {/* Nested children */}
            {!isCollapsed && !isAtMaxDepth && children.length > 0 && (
              <div className="mt-1">
                {children.map((child) => renderComment(child))}
              </div>
            )}
          </div>
        </div>
      </div>
    )
  }

  // Loading state
  if (isLoading || comments === undefined) {
    return (
      <div className="space-y-4">
        {[...Array(2)].map((_, i) => (
          <CommentSkeleton key={i} />
        ))}
      </div>
    )
  }

  return (
    <div className="space-y-2">
      {/* Sort header */}
      {comments.length > 0 && onSortChange && (
        <div className="flex items-center justify-between pb-1 border-b border-border">
          <span className="text-xs font-medium text-muted-foreground">
            {comments.length} comment{comments.length !== 1 ? "s" : ""}
          </span>
          <div className="flex items-center gap-1">
            <span className="text-xs text-muted-foreground mr-1">Sort:</span>
            {(["best", "new", "old", "controversial"] as SortOption[]).map((opt) => (
              <button
                key={opt}
                onClick={() => onSortChange(opt)}
                className={`text-xs px-2 py-0.5 rounded-full capitalize transition-colors ${
                  sortBy === opt
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:text-primary text-muted-foreground hover:text-primary"
                }`}
              >
                {opt}
              </button>
            ))}
          </div>
        </div>
      )}

      {comments.length === 0 ? (
        <div className="py-8 text-center">
          <p className="text-sm text-muted-foreground">No comments yet. Be the first to comment!</p>
        </div>
      ) : (
        <div className="space-y-3">
          {topLevelComments.map((comment) => renderComment(comment))}

          {/* Load More Button */}
          {hasMore && onLoadMore && (
            <div className="flex justify-center pt-2">
              <button
                onClick={onLoadMore}
                disabled={isLoadingMore}
                className="text-sm text-primary hover:text-primary/80 font-medium disabled:opacity-50 flex items-center gap-2 px-4 py-2 rounded-lg hover:bg-primary/5 transition-colors"
              >
                {isLoadingMore ? (
                  <>
                    <ButtonLoadingSpinner />
                    Loading more…
                  </>
                ) : (
                  <>
                    <ChevronDown className="w-4 h-4" />
                    Load more comments
                  </>
                )}
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
