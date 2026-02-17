"use client"

import { useState } from "react"
import Image from "next/image"
import { useMutation, useQuery } from "convex/react"
import { api } from "@/convex/_generated/api"
import { Id } from "@/convex/_generated/dataModel"
import { CommentSkeleton } from "@/components/ui/loading-skeleton"

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
  author: User | null
}

interface CommentListProps {
  postId: Id<"posts">
  comments: Comment[] | undefined
  isLoading?: boolean
}

export function CommentList({ postId, comments, isLoading = false }: CommentListProps) {
  const deleteComment = useMutation(api.comments.deleteComment)
  const currentUser = useQuery(api.users.getCurrentUser)
  const [deletingId, setDeletingId] = useState<Id<"comments"> | null>(null)

  const handleDeleteComment = async (commentId: Id<"comments">) => {
    try {
      setDeletingId(commentId)
      await deleteComment({ commentId })
    } catch (error) {
      console.error("Failed to delete comment:", error)
    } finally {
      setDeletingId(null)
    }
  }

  const formatTimestamp = (timestamp: number) => {
    const date = new Date(timestamp)
    const now = new Date()
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000)

    if (diffInSeconds < 60) {
      return "just now"
    } else if (diffInSeconds < 3600) {
      const minutes = Math.floor(diffInSeconds / 60)
      return `${minutes}m ago`
    } else if (diffInSeconds < 86400) {
      const hours = Math.floor(diffInSeconds / 3600)
      return `${hours}h ago`
    } else if (diffInSeconds < 604800) {
      const days = Math.floor(diffInSeconds / 86400)
      return `${days}d ago`
    } else {
      return date.toLocaleDateString()
    }
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

  // Handle empty state
  if (comments.length === 0) {
    return (
      <div className="py-8 text-center">
        <p className="text-sm text-gray-500">No comments yet. Be the first to comment!</p>
      </div>
    )
  }

  // Display comments chronologically (oldest first)
  return (
    <div className="space-y-4">
      {comments.map((comment) => {
        const author = comment.author

        return (
          <div key={comment._id} className="flex gap-3">
            {/* Author Avatar */}
            <div className="relative h-8 w-8 flex-shrink-0">
              {author?.profilePicture ? (
                <Image
                  src={author.profilePicture}
                  alt={author.name}
                  fill
                  className="rounded-full object-cover"
                />
              ) : (
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-600 text-xs font-bold text-white">
                  {author?.name.charAt(0).toUpperCase() || "?"}
                </div>
              )}
            </div>

            {/* Comment Content */}
            <div className="flex-1">
              <div className="rounded-lg bg-gray-100 dark:bg-gray-700 px-4 py-2">
                <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                  {author?.name || "Unknown User"}
                </p>
                <p className="mt-1 whitespace-pre-wrap text-sm text-gray-800 dark:text-gray-200">
                  {comment.content}
                </p>
              </div>
              <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                {formatTimestamp(comment.createdAt)}
              </p>
              {currentUser && currentUser._id === comment.authorId && (
                <button
                  onClick={() => handleDeleteComment(comment._id)}
                  disabled={deletingId === comment._id}
                  className="mt-1 text-xs text-red-500 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 disabled:opacity-50"
                  aria-label="Delete comment"
                >
                  {deletingId === comment._id ? "Deleting..." : "Delete"}
                </button>
              )}
            </div>
          </div>
        )
      })}
    </div>
  )
}
