"use client"

import { useRouter } from "next/navigation"
import Image from "next/image"
import { useMutation } from "convex/react"
import { api } from "@/../convex/_generated/api"
import { Id } from "@/../convex/_generated/dataModel"
import { formatDistanceToNow } from "date-fns"
import { Heart, MessageCircle, AtSign, UserPlus, MessageSquare, Calendar } from "lucide-react"

interface NotificationItemProps {
  notification: {
    _id: Id<"notifications">
    recipientId: Id<"users">
    actorId: Id<"users">
    type: "reaction" | "comment" | "mention" | "follow" | "reply" | "message" | "event"
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
      try {
        await markAsRead({ notificationId: notification._id })
        onRead?.()
      } catch (error) {
        console.error("Failed to mark notification as read:", error)
      }
    }

    // Navigate to the referenced content
    if (notification.type === "follow") {
      router.push(`/profile/${notification.actorId}`)
    } else if (notification.type === "message") {
      router.push('/messages')
    } else if (notification.type === "event" && notification.referenceId) {
      router.push(`/events/${notification.referenceId}`)
    } else if (notification.referenceId) {
      router.push(`/feed?post=${notification.referenceId}`)
    }
  }

  // Get icon based on notification type
  const getIcon = () => {
    switch (notification.type) {
      case "reaction":
        return <Heart className="w-5 h-5 text-destructive" />
      case "comment":
        return <MessageCircle className="w-5 h-5 text-primary" />
      case "mention":
        return <AtSign className="w-5 h-5 text-purple-500" />
      case "follow":
        return <UserPlus className="w-5 h-5 text-success" />
      case "reply":
        return <MessageSquare className="w-5 h-5 text-indigo-500" />
      case "message":
        return <MessageSquare className="w-5 h-5 text-blue-500" />
      case "event":
        return <Calendar className="w-5 h-5 text-orange-500" />
      default:
        return null
    }
  }

  return (
    <button
      onClick={handleClick}
      className={`w-full px-4 py-4 text-left hover:bg-accent transition-colors ${
        !notification.isRead ? "bg-primary/10" : ""
      }`}
    >
      <div className="flex items-start space-x-3">
        {/* Actor Avatar */}
        <div className="flex-shrink-0">
          {notification.actor?.profilePicture ? (
            <Image
              src={notification.actor.profilePicture}
              alt={notification.actor.name}
              width={48}
              height={48}
              className="w-12 h-12 rounded-full"
            />
          ) : (
            <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center text-primary font-semibold text-lg">
              {notification.actor?.name.charAt(0) || "?"}
            </div>
          )}
          
          {/* Notification Icon Badge */}
          <div className="absolute ml-8 -mt-2 w-6 h-6 rounded-full bg-card flex items-center justify-center border-2 border-white border-background">
            {getIcon()}
          </div>
        </div>

        {/* Notification Content */}
        <div className="flex-1 min-w-0">
          <p className={`text-sm ${!notification.isRead ? "font-semibold" : ""} text-foreground`}>
            {notification.message}
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            {formatDistanceToNow(notification.createdAt, { addSuffix: true })}
          </p>
        </div>

        {/* Unread Indicator */}
        {!notification.isRead && (
          <div className="flex-shrink-0 pt-1">
            <div className="w-2.5 h-2.5 bg-primary rounded-full" />
          </div>
        )}
      </div>
    </button>
  )
}
