"use client"

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

export function UserCard({ user }: UserCardProps) {
  return (
    <Link href={`/profile/${user._id}`}>
      <div className="flex items-start gap-4 rounded-lg border border-gray-200 bg-white p-4 transition-shadow hover:shadow-md">
        {/* Avatar */}
        <div className="relative h-12 w-12 flex-shrink-0">
          {user.profilePicture ? (
            <Image
              src={user.profilePicture}
              alt={user.name}
              fill
              className="rounded-full object-cover"
            />
          ) : (
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-blue-600 text-lg font-bold text-white">
              {user.name.charAt(0).toUpperCase()}
            </div>
          )}
        </div>

        {/* User Info */}
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-gray-900 truncate">{user.name}</h3>
          <div className="flex items-center gap-2 mt-1">
            <span className="text-xs rounded-full bg-blue-100 px-2 py-0.5 font-medium text-blue-800">
              {user.role}
            </span>
            {user.university && (
              <span className="text-sm text-gray-600 truncate">
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
                  className="text-xs rounded-full bg-gray-100 px-2 py-0.5 text-gray-700"
                >
                  {skill}
                </span>
              ))}
              {user.skills.length > 5 && (
                <span className="text-xs text-gray-500">
                  +{user.skills.length - 5} more
                </span>
              )}
            </div>
          )}
        </div>
      </div>
    </Link>
  )
}
