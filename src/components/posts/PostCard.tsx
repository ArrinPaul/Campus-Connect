"use client"

import { useState } from "react"
import Image from "next/image"
import { useMutation, useQuery } from "convex/react"
import { api } from "@/convex/_generated/api"
import { Id } from "@/convex/_generated/dataModel"

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

export function PostCard({ post, author }: PostCardProps) {
  const deletePost = useMutation(api.posts.deletePost)
  const likePost = useMutation(api.posts.likePost)
  const unlikePost = useMutation(api.posts.unlikePost)
  
  const currentUser = useQuery(api.users.getCurrentUser)
  const hasLiked = useQuery(api.posts.hasUserLikedPost, { postId: post._id })

  const [isDeleting, setIsDeleting] = useState(false)
  const [isLiking, setIsLiking] = useState(false)

  const isOwnPost = currentUser?._id === post.authorId

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

  const handleLikeToggle = async () => {
    if (isLiking) return

    setIsLiking(true)
    try {
      if (hasLiked) {
        await unlikePost({ postId: post._id })
      } else {
        await likePost({ postId: post._id })
      }
    } catch (error) {
      console.error("Failed to toggle like:", error)
    } finally {
      setIsLiking(false)
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
    <div className="rounded-lg bg-white p-6 shadow">
      {/* Author Info */}
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          {/* Avatar */}
          <div className="relative h-10 w-10 flex-shrink-0">
            {author.profilePicture ? (
              <Image
                src={author.profilePicture}
                alt={author.name}
                fill
                className="rounded-full object-cover"
              />
            ) : (
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-600 text-sm font-bold text-white">
                {author.name.charAt(0).toUpperCase()}
              </div>
            )}
          </div>

          {/* Name and Timestamp */}
          <div>
            <p className="font-semibold text-gray-900">{author.name}</p>
            <p className="text-sm text-gray-500">{formatTimestamp(post.createdAt)}</p>
          </div>
        </div>

        {/* Delete Button (only for own posts) */}
        {isOwnPost && (
          <button
            onClick={handleDelete}
            disabled={isDeleting}
            className="text-sm text-red-600 hover:text-red-800 disabled:opacity-50"
            aria-label="Delete post"
          >
            {isDeleting ? "Deleting..." : "Delete"}
          </button>
        )}
      </div>

      {/* Post Content */}
      <div className="mt-4">
        <p className="whitespace-pre-wrap text-gray-800">{post.content}</p>
      </div>

      {/* Engagement Stats and Actions */}
      <div className="mt-4 flex items-center gap-6 border-t pt-4">
        {/* Like Button */}
        <button
          onClick={handleLikeToggle}
          disabled={isLiking || !currentUser}
          className="flex items-center gap-2 text-gray-600 hover:text-red-600 disabled:opacity-50"
          aria-label={hasLiked ? "Unlike post" : "Like post"}
        >
          <svg
            className={`h-5 w-5 ${hasLiked ? "fill-red-600 text-red-600" : "fill-none"}`}
            stroke="currentColor"
            strokeWidth="2"
            viewBox="0 0 24 24"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z"
            />
          </svg>
          <span className="text-sm font-medium">{post.likeCount}</span>
        </button>

        {/* Comment Count */}
        <div className="flex items-center gap-2 text-gray-600">
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
          <span className="text-sm font-medium">{post.commentCount}</span>
        </div>
      </div>
    </div>
  )
}
