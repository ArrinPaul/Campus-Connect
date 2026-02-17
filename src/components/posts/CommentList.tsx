"use client"

import Image from "next/image"
import { Id } from "@/convex/_generated/dataModel"

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
  comments: Comment[]
}

export function CommentList({ postId, comments }: CommentListProps) {
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
              <div className="rounded-lg bg-gray-100 px-4 py-2">
                <p className="text-sm font-semibold text-gray-900">
                  {author?.name || "Unknown User"}
                </p>
                <p className="mt-1 whitespace-pre-wrap text-sm text-gray-800">
                  {comment.content}
                </p>
              </div>
              <p className="mt-1 text-xs text-gray-500">
                {formatTimestamp(comment.createdAt)}
              </p>
            </div>
          </div>
        )
      })}
    </div>
  )
}
