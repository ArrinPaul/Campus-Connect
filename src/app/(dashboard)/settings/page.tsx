"use client"

import { useUser } from "@clerk/nextjs"
import { useQuery } from "convex/react"
import { api } from "@/convex/_generated/api"
import { ProfileForm } from "@/components/profile/ProfileForm"
import { ThemeToggle } from "@/components/theme/theme-toggle"
import { LoadingSpinner } from "@/components/ui/loading-skeleton"

export default function SettingsPage() {
  const { isLoaded, isSignedIn } = useUser()
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
          <p className="mt-2 text-gray-600 dark:text-gray-400">Please sign in to access settings.</p>
        </div>
      </div>
    )
  }

  if (currentUser === undefined) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-8">
        <div className="h-10 w-32 rounded bg-gray-200 dark:bg-gray-700 mb-8" />
        
        <div className="mb-8 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-6">
          <div className="h-7 w-40 rounded bg-gray-200 dark:bg-gray-700 mb-4" />
          <div className="flex items-center justify-between">
            <div className="space-y-2">
              <div className="h-5 w-24 rounded bg-gray-200 dark:bg-gray-700" />
              <div className="h-4 w-48 rounded bg-gray-200 dark:bg-gray-700" />
            </div>
            <div className="h-10 w-20 rounded bg-gray-200 dark:bg-gray-700" />
          </div>
        </div>

        <div className="rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-6">
          <div className="h-7 w-48 rounded bg-gray-200 dark:bg-gray-700 mb-4" />
          <div className="space-y-6">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="space-y-2">
                <div className="h-4 w-24 rounded bg-gray-200 dark:bg-gray-700" />
                <div className="h-10 w-full rounded bg-gray-200 dark:bg-gray-700" />
              </div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  if (!currentUser) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-4">Not Authenticated</h1>
          <p className="text-gray-600 dark:text-gray-400">Please sign in to access settings.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-4xl px-4 py-8">
      <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-8">Settings</h1>

      {/* Theme Settings */}
      <div className="mb-8 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-6">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-4">Appearance</h2>
        <div className="flex items-center justify-between">
          <div>
            <p className="font-medium text-gray-900 dark:text-gray-100">Theme</p>
            <p className="text-sm text-gray-500 dark:text-gray-400">Choose your preferred theme</p>
          </div>
          <ThemeToggle />
        </div>
      </div>

      {/* Notification Settings */}
      <div className="mb-8 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-6">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-4">Notifications</h2>
        <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
          Choose what notifications you want to receive
        </p>
        <div className="space-y-4">
          <div className="flex items-center justify-between py-3 border-b border-gray-200 dark:border-gray-700">
            <div>
              <p className="font-medium text-gray-900 dark:text-gray-100">Reactions</p>
              <p className="text-sm text-gray-500 dark:text-gray-400">Get notified when someone reacts to your posts or comments</p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input type="checkbox" defaultChecked className="sr-only peer" />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
            </label>
          </div>

          <div className="flex items-center justify-between py-3 border-b border-gray-200 dark:border-gray-700">
            <div>
              <p className="font-medium text-gray-900 dark:text-gray-100">Comments</p>
              <p className="text-sm text-gray-500 dark:text-gray-400">Get notified when someone comments on your posts</p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input type="checkbox" defaultChecked className="sr-only peer" />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
            </label>
          </div>

          <div className="flex items-center justify-between py-3 border-b border-gray-200 dark:border-gray-700">
            <div>
              <p className="font-medium text-gray-900 dark:text-gray-100">Mentions</p>
              <p className="text-sm text-gray-500 dark:text-gray-400">Get notified when someone mentions you in a post or comment</p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input type="checkbox" defaultChecked className="sr-only peer" />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
            </label>
          </div>

          <div className="flex items-center justify-between py-3">
            <div>
              <p className="font-medium text-gray-900 dark:text-gray-100">New Followers</p>
              <p className="text-sm text-gray-500 dark:text-gray-400">Get notified when someone starts following you</p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input type="checkbox" defaultChecked className="sr-only peer" />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
            </label>
          </div>
        </div>
      </div>

      {/* Profile Settings */}
      <div className="rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-6">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-4">Profile Information</h2>
        <ProfileForm initialData={currentUser} />
      </div>
    </div>
  )
}
