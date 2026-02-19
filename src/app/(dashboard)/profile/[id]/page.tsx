"use client"

import { useQuery } from "convex/react"
import { api } from "@/convex/_generated/api"
import { useUser } from "@clerk/nextjs"
import { ProfileHeader } from "@/components/profile/ProfileHeader"
import { SkillsManager } from "@/components/profile/SkillsManager"
import { ProfileForm } from "@/components/profile/ProfileForm"
import { FollowersList } from "@/components/profile/FollowersList"
import { FollowingList } from "@/components/profile/FollowingList"
import { ProfileHeaderSkeleton, FullPageLoadingSpinner } from "@/components/ui/loading-skeleton"

interface ProfilePageProps {
  params: {
    id: string
  }
}

export default function ProfilePage({ params }: ProfilePageProps) {
  const { user: clerkUser, isLoaded, isSignedIn } = useUser()
  const profileUser = useQuery(
    api.users.getUserByIdOrUsername,
    isLoaded && isSignedIn ? { idOrUsername: params.id } : "skip"
  )
  const currentUser = useQuery(
    api.users.getCurrentUser,
    isLoaded && isSignedIn ? {} : "skip"
  )

  // Show loading state while auth is being checked
  if (!isLoaded) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-gray-300 border-t-blue-600"></div>
      </div>
    )
  }

  // Handle not authenticated
  if (!isSignedIn) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">Not Authenticated</h2>
          <p className="mt-2 text-gray-600 dark:text-gray-400">Please sign in to view profiles.</p>
        </div>
      </div>
    )
  }

  // Loading state
  if (profileUser === undefined || currentUser === undefined) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-8">
        <ProfileHeaderSkeleton />
        
        <div className="mt-8">
          <div className="h-8 w-32 rounded bg-gray-200 dark:bg-gray-700 mb-4" />
          <div className="flex flex-wrap gap-2">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-8 w-20 rounded-full bg-gray-200 dark:bg-gray-700" />
            ))}
          </div>
        </div>

        <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="space-y-3">
            <div className="h-8 w-40 rounded bg-gray-200 dark:bg-gray-700" />
            {[...Array(2)].map((_, i) => (
              <div key={i} className="h-20 rounded-lg bg-gray-200 dark:bg-gray-700" />
            ))}
          </div>
          <div className="space-y-3">
            <div className="h-8 w-40 rounded bg-gray-200 dark:bg-gray-700" />
            {[...Array(2)].map((_, i) => (
              <div key={i} className="h-20 rounded-lg bg-gray-200 dark:bg-gray-700" />
            ))}
          </div>
        </div>
      </div>
    )
  }

  // User not found
  if (profileUser === null) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">User Not Found</h1>
          <p className="text-gray-600 mb-8">
            The user you&apos;re looking for doesn&apos;t exist or has been removed.
          </p>
          <a
            href="/discover"
            className="inline-block rounded-md bg-blue-600 px-6 py-3 text-white hover:bg-blue-700"
          >
            Discover Users
          </a>
        </div>
      </div>
    )
  }

  // Determine if viewing own profile
  const isOwnProfile = currentUser?._id === profileUser._id

  return (
    <div className="mx-auto max-w-4xl px-4 py-8">
      {/* Profile Header */}
      <ProfileHeader user={profileUser} isOwnProfile={isOwnProfile} />

      {/* Skills Section */}
      <div className="mt-8">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">Skills</h2>
        {isOwnProfile ? (
          <SkillsManager skills={profileUser.skills} />
        ) : (
          <div className="flex flex-wrap gap-2">
            {profileUser.skills.length > 0 ? (
              profileUser.skills.map((skill) => (
                <span
                  key={skill}
                  className="inline-flex items-center rounded-full bg-blue-100 px-3 py-1 text-sm font-medium text-blue-800"
                >
                  {skill}
                </span>
              ))
            ) : (
              <p className="text-gray-500">No skills added yet</p>
            )}
          </div>
        )}
      </div>

      {/* Profile Form (only for own profile) */}
      {isOwnProfile && (
        <div className="mt-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Edit Profile</h2>
          <ProfileForm initialData={profileUser} />
        </div>
      )}

      {/* Followers and Following */}
      <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-8">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 mb-4">
            Followers ({profileUser.followerCount})
          </h2>
          <FollowersList userId={profileUser._id} />
        </div>
        <div>
          <h2 className="text-2xl font-bold text-gray-900 mb-4">
            Following ({profileUser.followingCount})
          </h2>
          <FollowingList userId={profileUser._id} />
        </div>
      </div>
    </div>
  )
}
