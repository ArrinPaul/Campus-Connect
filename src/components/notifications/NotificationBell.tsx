"use client"

import { useState, useEffect, useRef } from "react"
import Image from "next/image"
import { Bell, CheckCheck } from "lucide-react"
import { useQuery, useConvexAuth, useMutation } from "convex/react"
import { api } from "@/../convex/_generated/api"
import type { Id } from "@/../convex/_generated/dataModel"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { formatDistanceToNow } from "date-fns"
import { useLiveRegion } from "@/components/accessibility/LiveRegion"

/**
 * NotificationBell component
 * Shows bell icon with unread count badge
 * Dropdown with recent 5 notifications
 */
export function NotificationBell() {
  const [isOpen, setIsOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)
  const prevUnreadRef = useRef<number | undefined>(undefined)
  const router = useRouter()
  const { announce } = useLiveRegion()

  const { isAuthenticated } = useConvexAuth()
  const unreadCount = useQuery(api.notifications.getUnreadCount, isAuthenticated ? {} : 'skip')
  const recentNotifications = useQuery(api.notifications.getRecentNotifications, isAuthenticated ? {} : 'skip')

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

  // Announce changes in unread notification count to screen readers
  useEffect(() => {
    if (unreadCount === undefined) return
    const prev = prevUnreadRef.current
    if (prev !== undefined && unreadCount > prev) {
      const diff = unreadCount - prev
      announce(
        diff === 1
          ? "1 new notification"
          : `${diff} new notifications`,
        "polite"
      )
    }
    prevUnreadRef.current = unreadCount
  }, [unreadCount, announce])

  const markNotificationAsRead = useMutation(api.notifications.markAsRead);
  const markAllAsRead = useMutation(api.notifications.markAllAsRead);
  const [isMarkingAll, setIsMarkingAll] = useState(false);

  const handleMarkAllAsRead = async () => {
    setIsMarkingAll(true);
    try {
      await markAllAsRead({});
    } catch {
      // silently fail
    } finally {
      setIsMarkingAll(false);
    }
  };

  const handleNotificationClick = (notification: { _id: string; type?: string; actorId?: string; referenceId?: string }) => {
    setIsOpen(false)
    markNotificationAsRead({ notificationId: notification._id as Id<"notifications"> }).catch(() => {});
    switch (notification.type) {
      case 'message':
        router.push('/messages');
        break;
      case 'follow':
        router.push(`/profile/${notification.actorId}`);
        break;
      case 'event':
        router.push(`/events/${notification.referenceId}`);
        break;
      case 'achievement':
        router.push(`/profile/${notification.actorId}`);
        break;
      default:
        if (notification.referenceId) {
          router.push(`/feed?post=${notification.referenceId}`);
        }
    }
  }

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Bell Icon Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 text-muted-foreground hover:bg-accent rounded-lg transition-colors"
        aria-label={
          unreadCount
            ? `Notifications, ${unreadCount} unread`
            : "Notifications"
        }
        aria-haspopup="dialog"
        aria-expanded={isOpen}
        aria-controls="notification-dropdown"
      >
        <Bell className="w-6 h-6" aria-hidden="true" />

        {/* Unread Badge */}
        {unreadCount !== undefined && unreadCount > 0 && (
          <span
            aria-hidden="true"
            className="absolute top-0 right-0 flex items-center justify-center w-5 h-5 text-xs font-bold text-primary-foreground bg-destructive rounded-full"
          >
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown */}
      {isOpen && (
        <div
          id="notification-dropdown"
          role="dialog"
          aria-label="Notifications"
          aria-modal="false"
          className="absolute right-0 mt-2 w-80 bg-card border border-border rounded-lg shadow-lg z-50"
        >
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-border">
            <h3 className="font-semibold text-foreground">Notifications</h3>
            <div className="flex items-center gap-2">
              {unreadCount !== undefined && unreadCount > 0 && (
                <button
                  onClick={handleMarkAllAsRead}
                  disabled={isMarkingAll}
                  className="text-xs text-primary hover:underline flex items-center gap-1 disabled:opacity-50"
                  title="Mark all as read"
                >
                  <CheckCheck className="w-3.5 h-3.5" />
                  {isMarkingAll ? "Marking..." : "Read all"}
                </button>
              )}
              <Link
                href="/notifications"
                className="text-sm text-primary hover:underline"
                onClick={() => setIsOpen(false)}
              >
                View All
              </Link>
            </div>
          </div>

          {/* Notifications List */}
          <div className="max-h-96 overflow-y-auto">
            {!recentNotifications || recentNotifications.length === 0 ? (
              <div className="px-4 py-8 text-center text-muted-foreground">
                <Bell className="w-12 h-12 mx-auto mb-2 opacity-50" />
                <p>No notifications yet</p>
              </div>
            ) : (
              <div className="divide-y divide-gray-200 dark:divide-gray-700">
                {recentNotifications.map((notification) => (
                  <button
                    key={notification._id}
                    onClick={() => handleNotificationClick(notification)}
                    className={`w-full px-4 py-3 text-left hover:bg-accent transition-colors ${
                      !notification.isRead ? "bg-primary/10" : ""
                    }`}
                  >
                    <div className="flex items-start space-x-3">
                      {/* Actor Avatar */}
                      {notification.actor && (
                        <div className="flex-shrink-0">
                          {notification.actor.profilePicture ? (
                            <Image
                              src={notification.actor.profilePicture}
                              alt={notification.actor.name}
                              width={40}
                              height={40}
                              className="w-10 h-10 rounded-full"
                            />
                          ) : (
                            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-semibold">
                              {notification.actor.name.charAt(0)}
                            </div>
                          )}
                        </div>
                      )}

                      {/* Notification Content */}
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-foreground">
                          {notification.message}
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">
                          {formatDistanceToNow(notification.createdAt, { addSuffix: true })}
                        </p>
                      </div>

                      {/* Unread Indicator */}
                      {!notification.isRead && (
                        <div className="flex-shrink-0">
                          <div className="w-2 h-2 bg-primary rounded-full" />
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
            <div className="px-4 py-3 border-t border-border">
              <Link
                href="/notifications"
                className="block text-center text-sm text-primary hover:underline"
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
