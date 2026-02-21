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
      <div className="rounded-lg bg-card p-6 shadow-elevation-1">
        <h2 className="text-xl font-bold text-foreground mb-4">Following</h2>
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-20 animate-pulse rounded-lg bg-muted" />
          ))}
        </div>
      </div>
    )
  }

  if (following.length === 0) {
    return (
      <div className="rounded-lg bg-card p-6 shadow-elevation-1">
        <h2 className="text-xl font-bold text-foreground mb-4">Following</h2>
        <p className="text-muted-foreground text-center py-8">Not following anyone yet</p>
      </div>
    )
  }

  return (
    <div className="rounded-lg bg-card p-6 shadow-elevation-1">
      <h2 className="text-xl font-bold text-foreground mb-4">
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
