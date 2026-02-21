"use client"

import { useState, useEffect, useCallback } from "react"
import { useUser } from "@clerk/nextjs"
import { useQuery, useMutation } from "convex/react"
import { api } from "@/convex/_generated/api"
import { ProfileForm } from "@/components/profile/ProfileForm"
import { ThemeToggle } from "@/components/theme/theme-toggle"
import { StatusSelector } from "@/components/ui/StatusSelector"
import { LoadingSpinner } from "@/components/ui/loading-skeleton"

export default function SettingsPage() {
  const { isLoaded, isSignedIn } = useUser()
  const currentUser = useQuery(
    api.users.getCurrentUser,
    isLoaded && isSignedIn ? {} : "skip"
  )
  const updateNotificationPrefs = useMutation(api.users.updateNotificationPreferences)
  const updateOnlineVisibility = useMutation(api.presence.updateOnlineStatusVisibility)

  // Default preferences (all enabled)
  const defaultPrefs = { reactions: true, comments: true, mentions: true, follows: true }
  const savedPrefs = currentUser?.notificationPreferences ?? defaultPrefs
  
  const [notifPrefs, setNotifPrefs] = useState(defaultPrefs)
  const [prefsInitialized, setPrefsInitialized] = useState(false)
  const [showOnlineStatus, setShowOnlineStatus] = useState(true)

  // Initialize from server data once loaded
  useEffect(() => {
    if (currentUser && !prefsInitialized) {
      setNotifPrefs(currentUser.notificationPreferences ?? defaultPrefs)
      setShowOnlineStatus(currentUser.showOnlineStatus !== false)
      setPrefsInitialized(true)
    }
  }, [currentUser, prefsInitialized])

  const handleToggleNotifPref = useCallback(async (key: keyof typeof notifPrefs) => {
    const updated = { ...notifPrefs, [key]: !notifPrefs[key] }
    setNotifPrefs(updated)
    try {
      await updateNotificationPrefs(updated)
    } catch (err) {
      // Revert on error
      setNotifPrefs(notifPrefs)
      console.error("Failed to update notification preferences:", err)
    }
  }, [notifPrefs, updateNotificationPrefs])

  const handleToggleOnlineVisibility = useCallback(async () => {
    const newValue = !showOnlineStatus
    setShowOnlineStatus(newValue)
    try {
      await updateOnlineVisibility({ showOnlineStatus: newValue })
    } catch (err) {
      setShowOnlineStatus(!newValue) // revert
      console.error("Failed to update online visibility:", err)
    }
  }, [showOnlineStatus, updateOnlineVisibility])

  // Show loading state while auth is being checked
  if (!isLoaded) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-border border-t-primary"></div>
      </div>
    )
  }

  // Handle not authenticated
  if (!isSignedIn) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-foreground">Not Authenticated</h2>
          <p className="mt-2 text-muted-foreground">Please sign in to access settings.</p>
        </div>
      </div>
    )
  }

  if (currentUser === undefined) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-8">
        <div className="h-10 w-32 rounded bg-muted bg-muted mb-8" />
        
        <div className="mb-8 rounded-lg border border-border bg-card p-6">
          <div className="h-7 w-40 rounded bg-muted bg-muted mb-4" />
          <div className="flex items-center justify-between">
            <div className="space-y-2">
              <div className="h-5 w-24 rounded bg-muted bg-muted" />
              <div className="h-4 w-48 rounded bg-muted bg-muted" />
            </div>
            <div className="h-10 w-20 rounded bg-muted bg-muted" />
          </div>
        </div>

        <div className="rounded-lg border border-border bg-card p-6">
          <div className="h-7 w-48 rounded bg-muted bg-muted mb-4" />
          <div className="space-y-6">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="space-y-2">
                <div className="h-4 w-24 rounded bg-muted bg-muted" />
                <div className="h-10 w-full rounded bg-muted bg-muted" />
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
          <h1 className="text-2xl font-bold text-foreground mb-4">Not Authenticated</h1>
          <p className="text-muted-foreground">Please sign in to access settings.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-4xl px-4 py-8">
      <h1 className="text-3xl font-bold text-foreground mb-8">Settings</h1>

      {/* Theme Settings */}
      <div className="mb-8 rounded-lg border border-border bg-card p-6">
        <h2 className="text-xl font-semibold text-foreground mb-4">Appearance</h2>
        <div className="flex items-center justify-between">
          <div>
            <p className="font-medium text-foreground">Theme</p>
            <p className="text-sm text-muted-foreground">Choose your preferred theme</p>
          </div>
          <ThemeToggle />
        </div>
      </div>

      {/* Activity Status Settings */}
      <div className="mb-8 rounded-lg border border-border bg-card p-6">
        <h2 className="text-xl font-semibold text-foreground mb-4">Activity Status</h2>
        <p className="text-sm text-muted-foreground mb-4">
          Set your presence status and custom message
        </p>
        <StatusSelector
          currentStatus={(currentUser?.status as any) || "online"}
          currentCustomStatus={currentUser?.customStatus || ""}
        />
      </div>

      {/* Privacy Settings */}
      <div className="mb-8 rounded-lg border border-border bg-card p-6">
        <h2 className="text-xl font-semibold text-foreground mb-4">Privacy</h2>
        <div className="flex items-center justify-between py-3">
          <div>
            <p className="font-medium text-foreground">Show Online Status</p>
            <p className="text-sm text-muted-foreground">
              Let others see when you&apos;re online. When off, your status and last seen will be hidden.
            </p>
          </div>
          <label className="relative inline-flex items-center cursor-pointer">
            <input type="checkbox" checked={showOnlineStatus} onChange={handleToggleOnlineVisibility} className="sr-only peer" />
            <div className="w-11 h-6 bg-muted peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer bg-muted peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-card after:border-border after:border after:rounded-full after:h-5 after:w-5 after:transition-all border-border peer-checked:bg-primary"></div>
          </label>
        </div>
      </div>

      {/* Notification Settings */}
      <div className="mb-8 rounded-lg border border-border bg-card p-6">
        <h2 className="text-xl font-semibold text-foreground mb-4">Notifications</h2>
        <p className="text-sm text-muted-foreground mb-6">
          Choose what notifications you want to receive
        </p>
        <div className="space-y-4">
          <div className="flex items-center justify-between py-3 border-b border-border">
            <div>
              <p className="font-medium text-foreground">Reactions</p>
              <p className="text-sm text-muted-foreground">Get notified when someone reacts to your posts or comments</p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input type="checkbox" checked={notifPrefs.reactions} onChange={() => handleToggleNotifPref("reactions")} className="sr-only peer" />
              <div className="w-11 h-6 bg-muted peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer bg-muted peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-card after:border-border after:border after:rounded-full after:h-5 after:w-5 after:transition-all border-border peer-checked:bg-primary"></div>
            </label>
          </div>

          <div className="flex items-center justify-between py-3 border-b border-border">
            <div>
              <p className="font-medium text-foreground">Comments</p>
              <p className="text-sm text-muted-foreground">Get notified when someone comments on your posts</p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input type="checkbox" checked={notifPrefs.comments} onChange={() => handleToggleNotifPref("comments")} className="sr-only peer" />
              <div className="w-11 h-6 bg-muted peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer bg-muted peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-card after:border-border after:border after:rounded-full after:h-5 after:w-5 after:transition-all border-border peer-checked:bg-primary"></div>
            </label>
          </div>

          <div className="flex items-center justify-between py-3 border-b border-border">
            <div>
              <p className="font-medium text-foreground">Mentions</p>
              <p className="text-sm text-muted-foreground">Get notified when someone mentions you in a post or comment</p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input type="checkbox" checked={notifPrefs.mentions} onChange={() => handleToggleNotifPref("mentions")} className="sr-only peer" />
              <div className="w-11 h-6 bg-muted peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer bg-muted peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-card after:border-border after:border after:rounded-full after:h-5 after:w-5 after:transition-all border-border peer-checked:bg-primary"></div>
            </label>
          </div>

          <div className="flex items-center justify-between py-3">
            <div>
              <p className="font-medium text-foreground">New Followers</p>
              <p className="text-sm text-muted-foreground">Get notified when someone starts following you</p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input type="checkbox" checked={notifPrefs.follows} onChange={() => handleToggleNotifPref("follows")} className="sr-only peer" />
              <div className="w-11 h-6 bg-muted peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer bg-muted peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-card after:border-border after:border after:rounded-full after:h-5 after:w-5 after:transition-all border-border peer-checked:bg-primary"></div>
            </label>
          </div>
        </div>
      </div>

      {/* Profile Settings */}
      <div className="rounded-lg border border-border bg-card p-6">
        <h2 className="text-xl font-semibold text-foreground mb-4">Profile Information</h2>
        <ProfileForm initialData={currentUser} />
      </div>
    </div>
  )
}
