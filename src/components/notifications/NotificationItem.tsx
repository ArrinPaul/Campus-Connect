"use client"

import { useRouter } from "next/navigation"
import { useMutation } from "convex/react"
import { api } from "@/../convex/_generated/api"
import { Id } from "@/../convex/_generated/dataModel"
import { formatDistanceToNow } from "date-fns"
import { Heart, MessageCircle, AtSign, UserPlus, MessageSquare } from "lucide-react"

interface NotificationItemProps {
  notification: {
    _id: Id<"notifications">
    recipientId: Id<"users">
    actorId: Id<"users">
    type: "reaction" | "comment" | "mention" | "follow" | "reply"
    referenceId?: string
    message: string
    isRead: boolean
    createdAt: number
    actor: {
      _id: Id<"users">
      name: string
      profilePicture?: string
    } | null
  }
  onRead?: () => void
}

/**
 * NotificationItem component
 * Displays a single notification with appropriate icon and styling
 */
export function NotificationItem({ notification, onRead }: NotificationItemProps) {
  const router = useRouter()
  const markAsRead = useMutation(api.notifications.markAsRead)

  const handleClick = async () => {
    // Mark as read if unread
    if (!notification.isRead) {
      await markAsRead({ notificationId: notification._id })
      onRead?.()
    }

    // Navigate to the referenced content
    if (notification.referenceId) {
      if (notification.type === "follow") {
        router.push(`/profile/${notification.actorId}`)
      } else {
        // For posts/comments, navigate to the post
        router.push(`/feed?post=${notification.referenceId}`)
      }
    } else if (notification.type === "follow") {
      router.push(`/profile/${notification.actorId}`)
    }
  }

  // Get icon based on notification type
  const getIcon = () => {
    switch (notification.type) {
      case "reaction":
        return <Heart className="w-5 h-5 text-red-500" />
      case "comment":
        return <MessageCircle className="w-5 h-5 text-blue-500" />
      case "mention":
        return <AtSign className="w-5 h-5 text-purple-500" />
      case "follow":
        return <UserPlus className="w-5 h-5 text-green-500" />
      case "reply":
        return <MessageSquare className="w-5 h-5 text-indigo-500" />
      default:
        return null
    }
  }

  return (
    <button
      onClick={handleClick}
      className={`w-full px-4 py-4 text-left hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors ${
        !notification.isRead ? "bg-blue-50 dark:bg-blue-900/20" : ""
      }`}
    >
      <div className="flex items-start space-x-3">
        {/* Actor Avatar */}
        <div className="flex-shrink-0">
          {notification.actor?.profilePicture ? (
            <img
              src={notification.actor.profilePicture}
              alt={notification.actor.name}
              className="w-12 h-12 rounded-full"
            />
          ) : (
            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center text-white font-semibold text-lg">
              {notification.actor?.name.charAt(0) || "?"}
            </div>
          )}
          
          {/* Notification Icon Badge */}
          <div className="absolute ml-8 -mt-2 w-6 h-6 rounded-full bg-white dark:bg-gray-900 flex items-center justify-center border-2 border-white dark:border-gray-900">
            {getIcon()}
          </div>
        </div>

        {/* Notification Content */}
        <div className="flex-1 min-w-0">
          <p className={`text-sm ${!notification.isRead ? "font-semibold" : ""} text-gray-900 dark:text-white`}>
            {notification.message}
          </p>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
            {formatDistanceToNow(notification.createdAt, { addSuffix: true })}
          </p>
        </div>

        {/* Unread Indicator */}
        {!notification.isRead && (
          <div className="flex-shrink-0 pt-1">
            <div className="w-2.5 h-2.5 bg-blue-500 rounded-full" />
          </div>
        )}
      </div>
    </button>
  )
}
