"use client"

import { useUser } from "@clerk/nextjs"
import { useQuery } from "convex/react"
import { api } from "@/convex/_generated/api"
import { Id } from "@/convex/_generated/dataModel"
import { UserCard } from "./UserCard"

interface FollowingListProps {
  userId: Id<"users">
}

export function FollowingList({ userId }: FollowingListProps) {
  const { isLoaded, isSignedIn } = useUser()
  const following = useQuery(
    api.follows.getFollowing,
    isLoaded && isSignedIn ? { userId } : "skip"
  )

  if (following === undefined) {
    return (
      <div className="rounded-lg bg-white dark:bg-gray-800 p-6 shadow dark:shadow-gray-900/50">
        <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-4">Following</h2>
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-20 animate-pulse rounded-lg bg-gray-200" />
          ))}
        </div>
      </div>
    )
  }

  if (following.length === 0) {
    return (
      <div className="rounded-lg bg-white dark:bg-gray-800 p-6 shadow dark:shadow-gray-900/50">
        <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-4">Following</h2>
        <p className="text-gray-600 dark:text-gray-400 text-center py-8">Not following anyone yet</p>
      </div>
    )
  }

  return (
    <div className="rounded-lg bg-white dark:bg-gray-800 p-6 shadow dark:shadow-gray-900/50">
      <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-4">
        Following ({following.length})
      </h2>
      <div className="space-y-3">
        {following.map((user) => (
          <UserCard key={user._id} user={user} />
        ))}
      </div>
    </div>
  )
}
