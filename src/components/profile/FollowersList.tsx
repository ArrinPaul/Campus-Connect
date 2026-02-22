"use client"

import { useUser } from "@clerk/nextjs"
import { useQuery } from "convex/react"
import { api } from "@/convex/_generated/api"
import { Id } from "@/convex/_generated/dataModel"
import { UserCard } from "./UserCard"

interface FollowersListProps {
  userId: Id<"users">
}

export function FollowersList({ userId }: FollowersListProps) {
  const { isLoaded, isSignedIn } = useUser()
  const followersData = useQuery(
    api.follows.getFollowers,
    isLoaded && isSignedIn ? { userId } : "skip"
  )

  if (followersData === undefined) {
    return (
      <div className="rounded-lg bg-card p-6 shadow-elevation-1">
        <h2 className="text-xl font-bold text-foreground mb-4">Followers</h2>
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-20 animate-pulse rounded-lg bg-muted" />
          ))}
        </div>
      </div>
    )
  }

  const followers = followersData.users ?? followersData

  if (!Array.isArray(followers) || followers.length === 0) {
    return (
      <div className="rounded-lg bg-card p-6 shadow-elevation-1">
        <h2 className="text-xl font-bold text-foreground mb-4">Followers</h2>
        <p className="text-muted-foreground text-center py-8">No followers yet</p>
      </div>
    )
  }

  return (
    <div className="rounded-lg bg-card p-6 shadow-elevation-1">
      <h2 className="text-xl font-bold text-foreground mb-4">
        Followers ({followers.length})
      </h2>
      <div className="space-y-3">
        {followers.map((follower: any) => (
          <UserCard key={follower._id} user={follower} />
        ))}
      </div>
    </div>
  )
}
