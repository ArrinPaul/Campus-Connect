"use client"

import { useRouter } from "next/navigation"
import { OptimizedImage } from "@/components/ui/OptimizedImage"
import { useMutation } from "@/lib/api"
import { api } from "@/lib/api"
import { Id } from "@/lib/api"
import { formatDistanceToNow } from "date-fns"
import { Heart, MessageCircle, AtSign, UserPlus, MessageSquare, Calendar, Award } from "lucide-react"
import { cn } from "@/lib/utils"

interface NotificationItemProps {
  notification: {
    _id: Id<"notifications">
    recipientId: Id<"users">
    actorId: Id<"users">
    type: "reaction" | "comment" | "mention" | "follow" | "reply" | "message" | "event" | "achievement"
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

export function NotificationItem({ notification, onRead }: NotificationItemProps) {
  const router = useRouter()
  const markAsRead = useMutation(api.notifications.markAsRead)

  const handleClick = async () => {
    if (!notification.isRead) {
      try {
        await markAsRead({ notificationId: notification._id })
        onRead?.()
      } catch (error) {
        console.error("Failed to mark notification as read:", error)
      }
    }

    if (notification.type === "follow") {
      router.push(`/profile/${notification.actorId}`)
    } else if (notification.type === "message") {
      router.push('/messages')
    } else if (notification.type === "event" && notification.referenceId) {
      router.push(`/events/${notification.referenceId}`)
    } else if (notification.type === "achievement") {
      router.push(`/profile/${notification.actorId}`)
    } else if (notification.referenceId) {
      router.push(`/post/${notification.referenceId}`)
    }
  }

  const getIcon = () => {
    const iconClass = "w-3.5 h-3.5";
    switch (notification.type) {
      case "reaction": return <Heart className={cn(iconClass, "fill-[#ED4956] text-[#ED4956]")} />
      case "comment": return <MessageCircle className={cn(iconClass, "text-primary")} />
      case "mention": return <AtSign className={cn(iconClass, "text-amber-500")} />
      case "follow": return <UserPlus className={cn(iconClass, "text-primary")} />
      case "reply": return <MessageSquare className={cn(iconClass, "text-primary")} />
      case "message": return <MessageSquare className={cn(iconClass, "text-emerald-500")} />
      case "event": return <Calendar className={cn(iconClass, "text-purple-500")} />
      case "achievement": return <Award className={cn(iconClass, "text-amber-500")} />
      default: return null
    }
  }

  return (
    <button
      onClick={handleClick}
      className={cn(
        "w-full px-4 py-3.5 flex items-center justify-between gap-3 text-left transition-all active:scale-[0.99] border-b border-border relative group rounded-xl",
        !notification.isRead ? "bg-primary/5 hover:bg-primary/10" : "bg-card hover:bg-muted/50"
      )}
    >
      <div className="flex items-center gap-3.5 min-w-0 flex-1">
        {/* Actor Avatar */}
        <div className="relative shrink-0">
          <div className="h-11 w-11 rounded-full overflow-hidden border border-border bg-muted">
            {notification.actor?.profilePicture ? (
              <OptimizedImage
                src={notification.actor.profilePicture}
                alt={notification.actor.name}
                width={44}
                height={44}
                isAvatar
                className="h-full w-full object-cover"
              />
            ) : (
              <div className="h-full w-full flex items-center justify-center bg-primary/10 text-primary font-bold text-sm">
                {notification.actor?.name.charAt(0) || "?"}
              </div>
            )}
          </div>
          
          {/* Notification Icon Badge */}
          <div className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-card border border-border flex items-center justify-center shadow-xs">
            {getIcon()}
          </div>
        </div>

        {/* Notification Content */}
        <div className="flex-1 min-w-0">
          <p className={cn(
            "text-[13px] text-foreground leading-snug",
            !notification.isRead ? "font-semibold" : "font-normal"
          )}>
            {notification.message}
          </p>
          <p className="text-[11px] text-muted-foreground mt-0.5 font-medium" suppressHydrationWarning>
            {formatDistanceToNow(notification.createdAt, { addSuffix: true })}
          </p>
        </div>
      </div>

      {/* Unread Indicator Dot */}
      {!notification.isRead && (
        <div className="shrink-0 h-2.5 w-2.5 rounded-full bg-primary shadow-xs" />
      )}
    </button>
  )
}
