"use client"

import { useState, useEffect, useRef } from "react"
import { Bell } from "lucide-react"
import { useQuery } from "convex/react"
import { api } from "@/../convex/_generated/api"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { formatDistanceToNow } from "date-fns"

/**
 * NotificationBell component
 * Shows bell icon with unread count badge
 * Dropdown with recent 5 notifications
 */
export function NotificationBell() {
  const [isOpen, setIsOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)
  const router = useRouter()

  const unreadCount = useQuery(api.notifications.getUnreadCount)
  const recentNotifications = useQuery(api.notifications.getRecentNotifications)

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }

    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  const handleNotificationClick = (notificationId: string, referenceId?: string) => {
    setIsOpen(false)
    // Navigate to the referenced post/profile if available
    if (referenceId) {
      router.push(`/feed?post=${referenceId}`)
    }
  }

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Bell Icon Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
        aria-label="Notifications"
      >
        <Bell className="w-6 h-6" />
        
        {/* Unread Badge */}
        {unreadCount !== undefined && unreadCount > 0 && (
          <span className="absolute top-0 right-0 flex items-center justify-center w-5 h-5 text-xs font-bold text-white bg-red-500 rounded-full">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg z-50">
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200 dark:border-gray-700">
            <h3 className="font-semibold text-gray-900 dark:text-white">Notifications</h3>
            <Link
              href="/notifications"
              className="text-sm text-blue-600 dark:text-blue-400 hover:underline"
              onClick={() => setIsOpen(false)}
            >
              View All
            </Link>
          </div>

          {/* Notifications List */}
          <div className="max-h-96 overflow-y-auto">
            {!recentNotifications || recentNotifications.length === 0 ? (
              <div className="px-4 py-8 text-center text-gray-500 dark:text-gray-400">
                <Bell className="w-12 h-12 mx-auto mb-2 opacity-50" />
                <p>No notifications yet</p>
              </div>
            ) : (
              <div className="divide-y divide-gray-200 dark:divide-gray-700">
                {recentNotifications.map((notification) => (
                  <button
                    key={notification._id}
                    onClick={() => handleNotificationClick(notification._id, notification.referenceId)}
                    className={`w-full px-4 py-3 text-left hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors ${
                      !notification.isRead ? "bg-blue-50 dark:bg-blue-900/20" : ""
                    }`}
                  >
                    <div className="flex items-start space-x-3">
                      {/* Actor Avatar */}
                      {notification.actor && (
                        <div className="flex-shrink-0">
                          {notification.actor.profilePicture ? (
                            <img
                              src={notification.actor.profilePicture}
                              alt={notification.actor.name}
                              className="w-10 h-10 rounded-full"
                            />
                          ) : (
                            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center text-white font-semibold">
                              {notification.actor.name.charAt(0)}
                            </div>
                          )}
                        </div>
                      )}

                      {/* Notification Content */}
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-gray-900 dark:text-white">
                          {notification.message}
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                          {formatDistanceToNow(notification.createdAt, { addSuffix: true })}
                        </p>
                      </div>

                      {/* Unread Indicator */}
                      {!notification.isRead && (
                        <div className="flex-shrink-0">
                          <div className="w-2 h-2 bg-blue-500 rounded-full" />
                        </div>
                      )}
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* View All Link (Footer) */}
          {recentNotifications && recentNotifications.length > 0 && (
            <div className="px-4 py-3 border-t border-gray-200 dark:border-gray-700">
              <Link
                href="/notifications"
                className="block text-center text-sm text-blue-600 dark:text-blue-400 hover:underline"
                onClick={() => setIsOpen(false)}
              >
                View all notifications
              </Link>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
