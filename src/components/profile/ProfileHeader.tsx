"use client"

import Image from "next/image"
import { useState } from "react"
import { useMutation, useQuery } from "convex/react"
import { api } from "@/convex/_generated/api"
import { Id } from "@/convex/_generated/dataModel"

interface User {
  _id: Id<"users">
  name: string
  profilePicture?: string
  bio?: string
  role: "Student" | "Research Scholar" | "Faculty"
  university?: string
  experienceLevel: "Beginner" | "Intermediate" | "Advanced" | "Expert"
  followerCount: number
  followingCount: number
}

interface ProfileHeaderProps {
  user: User
  isOwnProfile: boolean
}

export function ProfileHeader({ user, isOwnProfile }: ProfileHeaderProps) {
  const followUser = useMutation(api.follows.followUser)
  const unfollowUser = useMutation(api.follows.unfollowUser)
  const isFollowingQuery = useQuery(api.follows.isFollowing, { userId: user._id })
  
  const [optimisticFollowing, setOptimisticFollowing] = useState<boolean | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  
  // Use optimistic state if available, otherwise use query result
  const isFollowing = optimisticFollowing !== null ? optimisticFollowing : (isFollowingQuery ?? false)
  
  const handleFollowToggle = async () => {
    try {
      setIsLoading(true)
      // Optimistically update the UI
      setOptimisticFollowing(!isFollowing)
      
      if (isFollowing) {
        await unfollowUser({ userId: user._id })
      } else {
        await followUser({ userId: user._id })
      }
      
      // Reset optimistic state after successful mutation
      setOptimisticFollowing(null)
    } catch (error) {
      // Revert optimistic update on error
      setOptimisticFollowing(null)
      console.error("Failed to toggle follow:", error)
    } finally {
      setIsLoading(false)
    }
  }
  return (
    <div className="rounded-lg bg-white dark:bg-gray-800 p-4 shadow dark:shadow-gray-900/50 sm:p-6">
      <div className="flex flex-col items-center gap-4 sm:flex-row sm:items-start sm:gap-6">
        {/* Avatar */}
        <div className="relative h-20 w-20 flex-shrink-0 sm:h-24 sm:w-24">
          {user.profilePicture ? (
            <Image
              src={user.profilePicture}
              alt={user.name}
              fill
              sizes="(max-width: 640px) 80px, 96px"
              className="rounded-full object-cover"
              priority
            />
          ) : (
            <div className="flex h-20 w-20 items-center justify-center rounded-full bg-blue-600 text-2xl font-bold text-white sm:h-24 sm:w-24 sm:text-3xl">
              {user.name.charAt(0).toUpperCase()}
            </div>
          )}
        </div>

        {/* User Info */}
        <div className="flex-1 text-center sm:text-left">
          <h1 className="text-xl font-bold text-gray-900 dark:text-gray-100 sm:text-2xl">{user.name}</h1>

          <div className="mt-2 flex flex-wrap items-center justify-center gap-2 sm:justify-start">
            <span className="rounded-full bg-blue-100 dark:bg-blue-900 px-3 py-1 text-xs font-medium text-blue-800 dark:text-blue-200 sm:text-sm">
              {user.role}
            </span>
            <span className="rounded-full bg-gray-100 dark:bg-gray-700 px-3 py-1 text-xs font-medium text-gray-800 dark:text-gray-200 sm:text-sm">
              {user.experienceLevel}
            </span>
          </div>

          {user.university && (
            <p className="mt-2 text-xs text-gray-600 dark:text-gray-400 sm:text-sm">{user.university}</p>
          )}

          {user.bio && (
            <p className="mt-2 text-sm text-gray-700 dark:text-gray-300 sm:mt-3">{user.bio}</p>
          )}

          {/* Stats */}
          <div className="mt-3 flex justify-center gap-4 sm:mt-4 sm:justify-start sm:gap-6">
            <div className="text-center">
              <p className="text-xl font-bold text-gray-900 dark:text-gray-100 sm:text-2xl">
                {user.followerCount}
              </p>
              <p className="text-xs text-gray-600 dark:text-gray-400 sm:text-sm">Followers</p>
            </div>
            <div className="text-center">
              <p className="text-xl font-bold text-gray-900 dark:text-gray-100 sm:text-2xl">
                {user.followingCount}
              </p>
              <p className="text-xs text-gray-600 dark:text-gray-400 sm:text-sm">Following</p>
            </div>
          </div>
        </div>

        {/* Follow Button (only for other users) */}
        {!isOwnProfile && (
          <div className="flex-shrink-0 w-full sm:w-auto">
            <button 
              onClick={handleFollowToggle}
              disabled={isLoading}
              className={`w-full rounded-md px-6 py-2 text-sm font-medium text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 sm:w-auto ${
                isFollowing 
                  ? "bg-gray-600 hover:bg-gray-700 dark:bg-gray-700 dark:hover:bg-gray-600" 
                  : "bg-blue-600 hover:bg-blue-700"
              } disabled:opacity-50 disabled:cursor-not-allowed`}
              style={{ minHeight: "44px" }}
            >
              {isLoading ? "..." : isFollowing ? "Unfollow" : "Follow"}
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
