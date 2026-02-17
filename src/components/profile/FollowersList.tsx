"use client"

import { useQuery } from "convex/react"
import { api } from "@/convex/_generated/api"
import { Id } from "@/convex/_generated/dataModel"
import { UserCard } from "./UserCard"

interface FollowersListProps {
  userId: Id<"users">
}

export function FollowersList({ userId }: FollowersListProps) {
  const followers = useQuery(api.follows.getFollowers, { userId })

  if (followers === undefined) {
    return (
      <div className="rounded-lg bg-white p-6 shadow">
        <h2 className="text-xl font-bold text-gray-900 mb-4">Followers</h2>
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-20 animate-pulse rounded-lg bg-gray-200" />
          ))}
        </div>
      </div>
    )
  }

  if (followers.length === 0) {
    return (
      <div className="rounded-lg bg-white p-6 shadow">
        <h2 className="text-xl font-bold text-gray-900 mb-4">Followers</h2>
        <p className="text-gray-600 text-center py-8">No followers yet</p>
      </div>
    )
  }

  return (
    <div className="rounded-lg bg-white p-6 shadow">
      <h2 className="text-xl font-bold text-gray-900 mb-4">
        Followers ({followers.length})
      </h2>
      <div className="space-y-3">
        {followers.map((follower) => (
          <UserCard key={follower._id} user={follower} />
        ))}
      </div>
    </div>
  )
}
