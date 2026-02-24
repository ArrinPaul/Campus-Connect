"use client"

import { memo } from "react"
import { OptimizedImage } from "@/components/ui/OptimizedImage"
import Link from "next/link"
import { Id } from "@/convex/_generated/dataModel"

interface User {
  _id: Id<"users">
  name: string
  profilePicture?: string
  role: "Student" | "Research Scholar" | "Faculty"
  university?: string
  skills: string[]
}

interface UserCardProps {
  user: User
}

export const UserCard = memo(function UserCard({ user }: UserCardProps) {
  return (
    <Link href={`/profile/${user._id}`}>
      <div className="flex items-start gap-3 rounded-lg border border-border bg-card p-3 transition-shadow hover:shadow-md dark:hover:shadow-gray-900/50 sm:gap-4 sm:p-4">
        {/* Avatar */}
        <div className="relative h-10 w-10 flex-shrink-0 sm:h-12 sm:w-12">
          {user.profilePicture ? (
            <OptimizedImage
              src={user.profilePicture}
              alt={user.name}
              fill
              isAvatar
              sizes="(max-width: 640px) 40px, 48px"
              className="rounded-full object-cover"
            />
          ) : (
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary text-base font-bold text-primary-foreground sm:h-12 sm:w-12 sm:text-lg">
              {user.name.charAt(0).toUpperCase()}
            </div>
          )}
        </div>

        {/* User Info */}
        <div className="flex-1 min-w-0">
          <h3 className="text-sm font-semibold text-foreground truncate sm:text-base">{user.name}</h3>
          <div className="flex flex-col gap-1 mt-1 sm:flex-row sm:items-center sm:gap-2">
            <span className="text-xs rounded-full bg-primary/10 px-2 py-0.5 font-medium text-primary w-fit">
              {user.role}
            </span>
            {user.university && (
              <span className="text-xs text-muted-foreground truncate sm:text-sm">
                {user.university}
              </span>
            )}
          </div>
          
          {/* Skills */}
          {user.skills.length > 0 && (
            <div className="mt-2 flex flex-wrap gap-1">
              {user.skills.slice(0, 5).map((skill) => (
                <span
                  key={skill}
                  className="text-xs rounded-full bg-muted px-2 py-0.5 text-foreground"
                >
                  {skill}
                </span>
              ))}
              {user.skills.length > 5 && (
                <span className="text-xs text-muted-foreground">
                  +{user.skills.length - 5} more
                </span>
              )}
            </div>
          )}
        </div>
      </div>
    </Link>
  )
})
