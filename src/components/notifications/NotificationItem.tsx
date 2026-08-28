"use client"

import { useRouter } from"next/navigation"
import { OptimizedImage } from"@/components/ui/OptimizedImage"
import { useMutation } from"@/lib/api"
import { api } from"@/lib/api"
import { Id } from"@/lib/api"
import { formatDistanceToNow } from"date-fns"
import { Heart, MessageCircle, AtSign, UserPlus, MessageSquare, Calendar, Award } from"lucide-react"
import { cn } from"@/lib/utils"

interface NotificationItemProps {
 notification: {
 _id: Id<"notifications">
 recipientId: Id<"users">
 actorId: Id<"users">
 type:"reaction" |"comment" |"mention" |"follow" |"reply" |"message" |"event" |"achievement"
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

 if (notification.type ==="follow") {
 router.push(`/profile/${notification.actorId}`)
 } else if (notification.type ==="message") {
 router.push('/messages')
 } else if (notification.type ==="event" && notification.referenceId) {
 router.push(`/events/${notification.referenceId}`)
 } else if (notification.type ==="achievement") {
 router.push(`/profile/${notification.actorId}`)
 } else if (notification.referenceId) {
 router.push(`/feed?post=${notification.referenceId}`)
 }
 }

 const getIcon = () => {
 const iconClass ="w-4 h-4";
 switch (notification.type) {
 case"reaction": return <Heart className={cn(iconClass,"text-primary")} />
 case"comment": return <MessageCircle className={cn(iconClass,"text-primary")} />
 case"mention": return <AtSign className={cn(iconClass,"text-primary")} />
 case"follow": return <UserPlus className={cn(iconClass,"text-primary")} />
 case"reply": return <MessageSquare className={cn(iconClass,"text-primary")} />
 case"message": return <MessageSquare className={cn(iconClass,"text-primary")} />
 case"event": return <Calendar className={cn(iconClass,"text-primary")} />
 case"achievement": return <Award className={cn(iconClass,"text-primary")} />
 default: return null
 }
 }

 return (
 <button
 onClick={handleClick}
 className={cn(
"w-full px-4 py-3 flex gap-3 text-left transition-all active:scale-[0.98] border-b border-border relative group",
 !notification.isRead ?"bg-card" :"bg-card hover:bg-card"
 )}
 >
 <div className="max-w-2xl mx-auto flex items-start gap-4">
 {/* Unread Dot */}
 {!notification.isRead && (
 <div className="absolute left-1 top-1/2 -translate-y-1/2">
 <div className="w-2 h-2 bg-primary rounded-full shadow-sm" />
 </div>
 )}

 {/* Actor Avatar */}
 <div className="relative flex-shrink-0">
 <div className="h-12 w-12 rounded-full overflow-hidden border border-border bg-card shadow-sm">
 {notification.actor?.profilePicture ? (
 <OptimizedImage
 src={notification.actor.profilePicture}
 alt={notification.actor.name}
 width={48}
 height={48}
 isAvatar
 className="h-full w-full object-cover"
 />
 ) : (
 <div className="h-full w-full flex items-center justify-center text-muted-foreground font-bold text-lg">
 {notification.actor?.name.charAt(0) ||"?"}
 </div>
 )}
 </div>
 
 {/* Notification Icon Badge */}
 <div className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-card border border-border flex items-center justify-center shadow-sm">
 {getIcon()}
 </div>
 </div>

 {/* Notification Content */}
 <div className="flex-1 min-w-0 py-0.5">
 <p className={cn(
"text-sm text-foreground leading-snug",
 !notification.isRead ?"font-semibold" :"font-normal"
 )}>
 {notification.message}
 </p>
 <p className="text-xs text-muted-foreground mt-1 font-medium">
 {formatDistanceToNow(notification.createdAt, { addSuffix: true })}
 </p>
 </div>
 
 {/* Right Arrow (Apple Style) */}
 <div className="flex-shrink-0 self-center opacity-0 group-hover:opacity-100 transition-opacity">
 <svg viewBox="0 0 24 24" width="16" height="16" stroke="currentColor" strokeWidth="3" fill="none" className="text-muted-foreground">
 <path d="M9 18l6-6-6-6" />
 </svg>
 </div>
 </div>
 </button>
 )
}

