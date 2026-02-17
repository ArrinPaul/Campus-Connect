"use client"

import { useState, memo } from "react"
import Image from "next/image"
import { useUser } from "@clerk/nextjs"
import { useMutation, useQuery } from "convex/react"
import { api } from "@/convex/_generated/api"
import { Id } from "@/convex/_generated/dataModel"
import { CommentList } from "@/components/posts/CommentList"
import { CommentComposer } from "@/components/posts/CommentComposer"
import { ReactionPicker, ReactionSummary } from "@/components/posts/ReactionPicker"
import { ReactionModal } from "@/components/posts/ReactionModal"
import { BookmarkButton } from "@/components/posts/BookmarkButton"

interface User {
  _id: Id<"users">
  name: string
  profilePicture?: string
  role: "Student" | "Research Scholar" | "Faculty"
}

interface Post {
  _id: Id<"posts">
  authorId: Id<"users">
  content: string
  likeCount: number
  commentCount: number
  createdAt: number
  updatedAt: number
}

interface PostCardProps {
  post: Post
  author: User
}

export const PostCard = memo(function PostCard({ post, author }: PostCardProps) {
  const { isLoaded, isSignedIn } = useUser()
  const deletePost = useMutation(api.posts.deletePost)
  
  const currentUser = useQuery(
    api.users.getCurrentUser,
    isLoaded && isSignedIn ? {} : "skip"
  )

  const [isDeleting, setIsDeleting] = useState(false)
  const [showComments, setShowComments] = useState(false)
  const [showReactionModal, setShowReactionModal] = useState(false)

  const isOwnPost = currentUser?._id === post.authorId

  // Only fetch comments when expanded
  const comments = useQuery(
    api.comments.getPostComments,
    showComments ? { postId: post._id } : "skip"
  )

  const handleDelete = async () => {
    if (!confirm("Are you sure you want to delete this post?")) {
      return
    }

    setIsDeleting(true)
    try {
      await deletePost({ postId: post._id })
    } catch (error) {
      console.error("Failed to delete post:", error)
      alert("Failed to delete post. Please try again.")
    } finally {
      setIsDeleting(false)
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

  return (
    <div className="rounded-lg bg-white dark:bg-gray-800 p-4 shadow dark:shadow-gray-900/50 sm:p-6">
      {/* Author Info */}
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Avatar */}
          <div className="relative h-8 w-8 flex-shrink-0 sm:h-10 sm:w-10">
            {author.profilePicture ? (
              <Image
                src={author.profilePicture}
                alt={author.name}
                fill
                sizes="(max-width: 640px) 32px, 40px"
                className="rounded-full object-cover"
              />
            ) : (
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-600 text-xs font-bold text-white sm:h-10 sm:w-10 sm:text-sm">
                {author.name.charAt(0).toUpperCase()}
              </div>
            )}
          </div>

          {/* Name and Timestamp */}
          <div>
            <p className="text-sm font-semibold text-gray-900 dark:text-gray-100 sm:text-base">{author.name}</p>
            <p className="text-xs text-gray-500 dark:text-gray-400 sm:text-sm">{formatTimestamp(post.createdAt)}</p>
          </div>
        </div>

        {/* Delete Button (only for own posts) */}
        {isOwnPost && (
          <button
            onClick={handleDelete}
            disabled={isDeleting}
            className="text-xs text-red-600 hover:text-red-800 disabled:opacity-50 sm:text-sm"
            aria-label="Delete post"
            style={{ minWidth: "44px", minHeight: "44px" }}
          >
            {isDeleting ? "Deleting..." : "Delete"}
          </button>
        )}
      </div>

      {/* Post Content */}
      <div className="mt-3 sm:mt-4">
        <p className="whitespace-pre-wrap text-sm text-gray-800 dark:text-gray-200 sm:text-base">{post.content}</p>
      </div>

      {/* Engagement Stats and Actions */}
      <div className="mt-3 flex items-center gap-4 border-t dark:border-gray-700 pt-3 sm:mt-4 sm:gap-6 sm:pt-4">
        {/* Reaction Picker */}
        {currentUser && (
          <ReactionPicker
            targetId={post._id}
            targetType="post"
          />
        )}
        
        {/* Reaction Summary - Click to see who reacted */}
        <ReactionSummary
          targetId={post._id}
          targetType="post"
          onClick={() => setShowReactionModal(true)}
        />

        {/* Comment Toggle Button */}
        <button
          onClick={() => setShowComments(!showComments)}
          className="flex items-center gap-1.5 text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 sm:gap-2"
          aria-label={showComments ? "Hide comments" : "Show comments"}
          style={{ minWidth: "44px", minHeight: "44px" }}
        >
          <svg
            className="h-5 w-5"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            viewBox="0 0 24 24"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M8.625 12a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H8.25m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H12m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0h-.375M21 12c0 4.556-4.03 8.25-9 8.25a9.764 9.764 0 01-2.555-.337A5.972 5.972 0 015.41 20.97a5.969 5.969 0 01-.474-.065 4.48 4.48 0 00.978-2.025c.09-.457-.133-.901-.467-1.226C3.93 16.178 3 14.189 3 12c0-4.556 4.03-8.25 9-8.25s9 3.694 9 8.25z"
            />
          </svg>
          <span className="text-xs font-medium sm:text-sm">{post.commentCount}</span>
        </button>

        {/* Bookmark Button */}
        {currentUser && (
          <BookmarkButton postId={post._id} />
        )}
      </div>

      {/* Reaction Modal */}
      <ReactionModal
        targetId={post._id}
        targetType="post"
        open={showReactionModal}
        onOpenChange={setShowReactionModal}
      />

      {/* Inline Comments Section */}
      <div className="mt-3 border-t dark:border-gray-700 pt-3 sm:mt-4 sm:pt-4 space-y-4">
        <CommentList postId={post._id} comments={comments} isLoading={comments === undefined} />
        <CommentComposer postId={post._id} />
      </div>
    </div>
  )
})
