"use client"

import { useQuery } from "convex/react"
import { api } from "@/convex/_generated/api"
import { ProfileForm } from "@/components/profile/ProfileForm"
import { ThemeToggle } from "@/components/theme/theme-toggle"
import { LoadingSpinner } from "@/components/ui/loading-skeleton"

export default function SettingsPage() {
  const currentUser = useQuery(api.users.getCurrentUser)

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

      {/* Profile Settings */}
      <div className="rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-6">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-4">Profile Information</h2>
        <ProfileForm initialData={currentUser} />
      </div>
    </div>
  )
}
