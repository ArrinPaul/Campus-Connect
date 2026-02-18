"use client"

import { useState } from "react"
import Link from "next/link"
import { Menu, X } from "lucide-react"
import { UserButton } from "@clerk/nextjs"
import { ThemeToggle } from "@/components/theme/theme-toggle"
import { Id } from "@/convex/_generated/dataModel"

interface MobileNavProps {
  currentUserId?: Id<"users">
}

export function MobileNav({ currentUserId }: MobileNavProps) {
  const [isOpen, setIsOpen] = useState(false)

  const toggleMenu = () => setIsOpen(!isOpen)
  const closeMenu = () => setIsOpen(false)

  return (
    <>
      {/* Mobile Menu Button */}
      <button
        onClick={toggleMenu}
        className="inline-flex items-center justify-center rounded-md p-2 text-gray-700 hover:bg-gray-100 hover:text-gray-900 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-blue-500 dark:text-gray-300 dark:hover:bg-gray-700 dark:hover:text-white md:hidden"
        aria-expanded={isOpen}
        aria-label="Toggle navigation menu"
        style={{ minWidth: "44px", minHeight: "44px" }}
      >
        {isOpen ? (
          <X className="h-6 w-6" aria-hidden="true" />
        ) : (
          <Menu className="h-6 w-6" aria-hidden="true" />
        )}
      </button>

      {/* Mobile Menu Overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-black bg-opacity-50 md:hidden"
          onClick={closeMenu}
          aria-hidden="true"
        />
      )}

      {/* Mobile Menu Panel */}
      <div
        className={`fixed right-0 top-0 z-50 h-full w-64 transform bg-white shadow-xl transition-transform duration-300 ease-in-out dark:bg-gray-800 md:hidden ${
          isOpen ? "translate-x-0" : "translate-x-full"
        }`}
      >
        <div className="flex h-full flex-col">
          {/* Header */}
          <div className="flex items-center justify-between border-b p-4 dark:border-gray-700">
            <span className="text-lg font-bold text-blue-600 dark:text-blue-400">
              Menu
            </span>
            <button
              onClick={closeMenu}
              className="rounded-md p-2 text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700"
              aria-label="Close menu"
              style={{ minWidth: "44px", minHeight: "44px" }}
            >
              <X className="h-6 w-6" />
            </button>
          </div>

          {/* Navigation Links */}
          <nav className="flex-1 space-y-1 p-4">
            <Link
              href="/feed"
              onClick={closeMenu}
              className="block rounded-md px-4 py-3 text-base font-medium text-gray-700 hover:bg-gray-100 hover:text-blue-600 dark:text-gray-300 dark:hover:bg-gray-700 dark:hover:text-blue-400"
              style={{ minHeight: "44px" }}
            >
              Feed
            </Link>
            <Link
              href="/discover"
              onClick={closeMenu}
              className="block rounded-md px-4 py-3 text-base font-medium text-gray-700 hover:bg-gray-100 hover:text-blue-600 dark:text-gray-300 dark:hover:bg-gray-700 dark:hover:text-blue-400"
              style={{ minHeight: "44px" }}
            >
              Discover
            </Link>
            <Link
              href="/bookmarks"
              onClick={closeMenu}
              className="block rounded-md px-4 py-3 text-base font-medium text-gray-700 hover:bg-gray-100 hover:text-blue-600 dark:text-gray-300 dark:hover:bg-gray-700 dark:hover:text-blue-400"
              style={{ minHeight: "44px" }}
            >
              Bookmarks
            </Link>
            <Link
              href="/notifications"
              onClick={closeMenu}
              className="block rounded-md px-4 py-3 text-base font-medium text-gray-700 hover:bg-gray-100 hover:text-blue-600 dark:text-gray-300 dark:hover:bg-gray-700 dark:hover:text-blue-400"
              style={{ minHeight: "44px" }}
            >
              Notifications
            </Link>
            {currentUserId && (
              <Link
                href={`/profile/${currentUserId}`}
                onClick={closeMenu}
                className="block rounded-md px-4 py-3 text-base font-medium text-gray-700 hover:bg-gray-100 hover:text-blue-600 dark:text-gray-300 dark:hover:bg-gray-700 dark:hover:text-blue-400"
                style={{ minHeight: "44px" }}
              >
                Profile
              </Link>
            )}
            <Link
              href="/settings"
              onClick={closeMenu}
              className="block rounded-md px-4 py-3 text-base font-medium text-gray-700 hover:bg-gray-100 hover:text-blue-600 dark:text-gray-300 dark:hover:bg-gray-700 dark:hover:text-blue-400"
              style={{ minHeight: "44px" }}
            >
              Settings
            </Link>
          </nav>

          {/* Footer with Theme Toggle and User Button */}
          <div className="border-t p-4 dark:border-gray-700">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <ThemeToggle />
                <span className="text-sm text-gray-600 dark:text-gray-400">
                  Theme
                </span>
              </div>
              <UserButton
                appearance={{
                  elements: {
                    avatarBox: "h-10 w-10",
                  },
                }}
                afterSignOutUrl="/"
              />
            </div>
          </div>
        </div>
      </div>
    </>
  )
}
