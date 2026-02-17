"use client"

import { memo } from "react"
import Image from "next/image"
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
      <div className="flex items-start gap-3 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-3 transition-shadow hover:shadow-md dark:hover:shadow-gray-900/50 sm:gap-4 sm:p-4">
        {/* Avatar */}
        <div className="relative h-10 w-10 flex-shrink-0 sm:h-12 sm:w-12">
          {user.profilePicture ? (
            <Image
              src={user.profilePicture}
              alt={user.name}
              fill
              sizes="(max-width: 640px) 40px, 48px"
              className="rounded-full object-cover"
            />
          ) : (
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-600 text-base font-bold text-white sm:h-12 sm:w-12 sm:text-lg">
              {user.name.charAt(0).toUpperCase()}
            </div>
          )}
        </div>

        {/* User Info */}
        <div className="flex-1 min-w-0">
          <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100 truncate sm:text-base">{user.name}</h3>
          <div className="flex flex-col gap-1 mt-1 sm:flex-row sm:items-center sm:gap-2">
            <span className="text-xs rounded-full bg-blue-100 dark:bg-blue-900 px-2 py-0.5 font-medium text-blue-800 dark:text-blue-200 w-fit">
              {user.role}
            </span>
            {user.university && (
              <span className="text-xs text-gray-600 dark:text-gray-400 truncate sm:text-sm">
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
                  className="text-xs rounded-full bg-gray-100 dark:bg-gray-700 px-2 py-0.5 text-gray-700 dark:text-gray-300"
                >
                  {skill}
                </span>
              ))}
              {user.skills.length > 5 && (
                <span className="text-xs text-gray-500 dark:text-gray-400">
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
