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
    <div className="rounded-lg bg-white p-6 shadow">
      <div className="flex flex-col items-center gap-6 sm:flex-row sm:items-start">
        {/* Avatar */}
        <div className="relative h-24 w-24 flex-shrink-0">
          {user.profilePicture ? (
            <Image
              src={user.profilePicture}
              alt={user.name}
              fill
              className="rounded-full object-cover"
            />
          ) : (
            <div className="flex h-24 w-24 items-center justify-center rounded-full bg-blue-600 text-3xl font-bold text-white">
              {user.name.charAt(0).toUpperCase()}
            </div>
          )}
        </div>

        {/* User Info */}
        <div className="flex-1 text-center sm:text-left">
          <h1 className="text-2xl font-bold text-gray-900">{user.name}</h1>

          <div className="mt-2 flex flex-wrap items-center justify-center gap-2 sm:justify-start">
            <span className="rounded-full bg-blue-100 px-3 py-1 text-sm font-medium text-blue-800">
              {user.role}
            </span>
            <span className="rounded-full bg-gray-100 px-3 py-1 text-sm font-medium text-gray-800">
              {user.experienceLevel}
            </span>
          </div>

          {user.university && (
            <p className="mt-2 text-sm text-gray-600">{user.university}</p>
          )}

          {user.bio && (
            <p className="mt-3 text-gray-700">{user.bio}</p>
          )}

          {/* Stats */}
          <div className="mt-4 flex justify-center gap-6 sm:justify-start">
            <div className="text-center">
              <p className="text-2xl font-bold text-gray-900">
                {user.followerCount}
              </p>
              <p className="text-sm text-gray-600">Followers</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-gray-900">
                {user.followingCount}
              </p>
              <p className="text-sm text-gray-600">Following</p>
            </div>
          </div>
        </div>

        {/* Follow Button (only for other users) */}
        {!isOwnProfile && (
          <div className="flex-shrink-0">
            <button 
              onClick={handleFollowToggle}
              disabled={isLoading}
              className={`rounded-md px-6 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
                isFollowing 
                  ? "bg-gray-600 hover:bg-gray-700" 
                  : "bg-blue-600 hover:bg-blue-700"
              } disabled:opacity-50 disabled:cursor-not-allowed`}
            >
              {isLoading ? "..." : isFollowing ? "Unfollow" : "Follow"}
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
