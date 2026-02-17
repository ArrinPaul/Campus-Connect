"use client"

import { useQuery } from "convex/react"
import { api } from "@/convex/_generated/api"
import { ProfileForm } from "@/src/components/profile/ProfileForm"
import { ThemeToggle } from "@/src/components/theme/theme-toggle"

export default function SettingsPage() {
  const currentUser = useQuery(api.users.getCurrentUser)

  if (currentUser === undefined) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-gray-300 border-t-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading settings...</p>
        </div>
      </div>
    )
  }

  if (!currentUser) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Not Authenticated</h1>
          <p className="text-gray-600">Please sign in to access settings.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-4xl px-4 py-8">
      <h1 className="text-3xl font-bold text-gray-900 mb-8">Settings</h1>

      {/* Theme Settings */}
      <div className="mb-8 rounded-lg border border-gray-200 bg-white p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Appearance</h2>
        <div className="flex items-center justify-between">
          <div>
            <p className="font-medium text-gray-900">Theme</p>
            <p className="text-sm text-gray-500">Choose your preferred theme</p>
          </div>
          <ThemeToggle />
        </div>
      </div>

      {/* Profile Settings */}
      <div className="rounded-lg border border-gray-200 bg-white p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Profile Information</h2>
        <ProfileForm initialData={currentUser} />
      </div>
    </div>
  )
}
