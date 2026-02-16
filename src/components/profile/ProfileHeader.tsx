"use client"

import Image from "next/image"
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
            <button className="rounded-md bg-blue-600 px-6 py-2 text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2">
              Follow
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
