"use client"

import { useState } from "react"
import { useQuery, useMutation } from "convex/react"
import { api } from "@/../convex/_generated/api"
import { NotificationItem } from "@/components/notifications/NotificationItem"
import { Bell, CheckCheck } from "lucide-react"

type NotificationFilter = "all" | "reaction" | "comment" | "mention" | "follow" | "reply"

/**
 * Notifications Page
 * Display user's notifications with filtering and pagination
 */
export default function NotificationsPage() {
  const [activeTab, setActiveTab] = useState<NotificationFilter>("all")
  const [cursor, setCursor] = useState<string | null>(null)

  const notificationsData = useQuery(api.notifications.getNotifications, {
    filter: activeTab,
    limit: 20,
    cursor: cursor ?? undefined,
  })

  const markAllAsRead = useMutation(api.notifications.markAllAsRead)
  const unreadCount = useQuery(api.notifications.getUnreadCount)

  const tabs: { value: NotificationFilter; label: string }[] = [
    { value: "all", label: "All" },
    { value: "mention", label: "Mentions" },
    { value: "reaction", label: "Reactions" },
    { value: "comment", label: "Comments" },
    { value: "follow", label: "Follows" },
  ]

  const handleMarkAllAsRead = async () => {
    try {
      await markAllAsRead({})
    } catch (error) {
      console.error("Failed to mark all as read:", error)
    }
  }

  const handleLoadMore = () => {
    if (notificationsData?.cursor) {
      setCursor(notificationsData.cursor)
    }
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-3">
            <Bell className="w-8 h-8 text-primary" />
            <h1 className="text-2xl font-bold text-foreground">
              Notifications
            </h1>
            {unreadCount !== undefined && unreadCount > 0 && (
              <span className="px-2.5 py-0.5 text-xs font-medium text-primary-foreground bg-destructive rounded-full">
                {unreadCount}
              </span>
            )}
          </div>

          {/* Mark All as Read Button */}
          {unreadCount !== undefined && unreadCount > 0 && (
            <button
              onClick={handleMarkAllAsRead}
              className="flex items-center space-x-2 px-4 py-2 text-sm font-medium text-primary hover:bg-primary/10 hover:bg-primary/10 rounded-lg transition-colors"
            >
              <CheckCheck className="w-4 h-4" />
              <span>Mark all as read</span>
            </button>
          )}
        </div>

        {/* Tabs */}
        <div className="bg-card rounded-lg shadow-sm border border-border overflow-hidden">
          <div className="flex border-b border-border overflow-x-auto">
            {tabs.map((tab) => (
              <button
                key={tab.value}
                onClick={() => {
                  setActiveTab(tab.value)
                  setCursor(null)
                }}
                className={`px-6 py-3 text-sm font-medium whitespace-nowrap transition-colors ${
                  activeTab === tab.value
                    ? "text-primary border-b-2 border-primary"
                    : "text-muted-foreground hover:text-foreground hover:text-foreground"
                }`}
              >
                {tab.label}
                {tab.value === "all" && unreadCount !== undefined && unreadCount > 0 && (
                  <span className="ml-2 px-2 py-0.5 text-xs font-medium text-primary-foreground bg-primary rounded-full">
                    {unreadCount}
                  </span>
                )}
              </button>
            ))}
          </div>

          {/* Notifications List */}
          <div className="divide-y divide-gray-200 dark:divide-gray-700">
            {notificationsData === undefined ? (
              <div className="px-4 py-16 text-center">
                <div className="w-16 h-16 mx-auto mb-4 bg-muted animate-pulse rounded-full" />
                <div className="h-5 w-40 mx-auto bg-muted animate-pulse rounded mb-2" />
                <div className="h-4 w-60 mx-auto bg-muted animate-pulse rounded" />
              </div>
            ) : notificationsData.notifications.length === 0 ? (
              <div className="px-4 py-16 text-center">
                <Bell className="w-16 h-16 mx-auto mb-4 text-muted-foreground dark:text-muted-foreground" />
                <h3 className="text-lg font-medium text-foreground mb-2">
                  No notifications yet
                </h3>
                <p className="text-muted-foreground">
                  {activeTab === "all"
                    ? "You'll see notifications here when people interact with your posts"
                    : `No ${activeTab} notifications yet`}
                </p>
              </div>
            ) : (
              <>
                {notificationsData.notifications.map((notification) => (
                  <NotificationItem
                    key={notification._id}
                    notification={notification}
                    onRead={() => {
                      // Refetch data after marking as read
                      // The useQuery hook will automatically refetch
                    }}
                  />
                ))}

                {/* Load More Button */}
                {notificationsData.cursor && (
                  <div className="p-4 text-center border-t border-border">
                    <button
                      onClick={handleLoadMore}
                      className="px-6 py-2 text-sm font-medium text-primary hover:bg-primary/10 hover:bg-primary/10 rounded-lg transition-colors"
                    >
                      Load more
                    </button>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
