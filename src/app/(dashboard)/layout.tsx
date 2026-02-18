"use client"

import { UserButton } from "@clerk/nextjs"
import Link from "next/link"
import { ThemeToggle } from "@/components/theme/theme-toggle"
import { MobileNav } from "@/components/navigation/mobile-nav"
import { NotificationBell } from "@/components/notifications/NotificationBell"
import { useQuery } from "convex/react"
import { api } from "@/convex/_generated/api"

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const currentUser = useQuery(api.users.getCurrentUser)
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Navigation Bar */}
      <nav className="border-b bg-white shadow-sm dark:bg-gray-800 dark:border-gray-700">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between">
            {/* Logo and Brand */}
            <div className="flex items-center">
              <Link href="/feed" className="text-lg font-bold text-blue-600 dark:text-blue-400 sm:text-xl">
                Campus Connect
              </Link>
            </div>

            {/* Desktop Navigation Links - Hidden on mobile */}
            <div className="hidden items-center gap-4 md:flex lg:gap-6">
              <Link
                href="/feed"
                className="text-sm font-medium text-gray-700 hover:text-blue-600 dark:text-gray-300 dark:hover:text-blue-400"
              >
                Feed
              </Link>
              <Link
                href="/discover"
                className="text-sm font-medium text-gray-700 hover:text-blue-600 dark:text-gray-300 dark:hover:text-blue-400"
              >
                Discover
              </Link>
              <Link
                href="/bookmarks"
                className="text-sm font-medium text-gray-700 hover:text-blue-600 dark:text-gray-300 dark:hover:text-blue-400"
              >
                Bookmarks
              </Link>
              {currentUser && (
                <Link
                  href={`/profile/${currentUser._id}`}
                  className="text-sm font-medium text-gray-700 hover:text-blue-600 dark:text-gray-300 dark:hover:text-blue-400"
                >
                  Profile
                </Link>
              )}
              <Link
                href="/settings"
                className="text-sm font-medium text-gray-700 hover:text-blue-600 dark:text-gray-300 dark:hover:text-blue-400"
              >
                Settings
              </Link>
              
              {/* Notification Bell */}
              <NotificationBell />
              
              {/* Theme Toggle */}
              <ThemeToggle />
              
              {/* User Button with logout */}
              <UserButton
                appearance={{
                  elements: {
                    avatarBox: "h-9 w-9",
                  },
                }}
                afterSignOutUrl="/"
              />
            </div>

            {/* Mobile Navigation - Shown only on mobile */}
            <div className="flex items-center md:hidden">
              <MobileNav currentUserId={currentUser?._id} />
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main>{children}</main>
    </div>
  )
}
