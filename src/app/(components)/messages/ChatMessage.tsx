"use client"

import { OptimizedImage } from "@/components/ui/OptimizedImage"
import { Id } from "@/lib/api"
import { format } from "date-fns"
import { cn } from "@/lib/utils"

interface ChatMessageProps {
  message: {
    _id: Id<"messages">
    senderId: Id<"users">
    content: string
    createdAt: number
    sender: {
      _id: Id<"users">
      name: string
      profilePicture?: string
    } | null
  }
  isOwn: boolean
  showSenderInfo?: boolean
}

export function ChatMessage({ message, isOwn, showSenderInfo }: ChatMessageProps) {
  return (
    <div className={cn(
      "w-full flex flex-col mb-4 px-4 animate-in",
      isOwn ? "items-end" : "items-start"
    )}>
      {/* Sender Name (only for group chats or if requested) */}
      {!isOwn && showSenderInfo && message.sender && (
        <span className="text-[10px] text-ink-muted-48 font-bold uppercase tracking-widest ml-1 mb-1">
          {message.sender.name}
        </span>
      )}

      <div className={cn(
        "flex max-w-[80%] md:max-w-[70%] group relative",
        isOwn ? "flex-row-reverse" : "flex-row"
      )}>
        {/* Avatar (only for incoming) */}
        {!isOwn && (
          <div className="flex-shrink-0 mr-2 mt-auto">
            <div className="h-8 w-8 rounded-full overflow-hidden border border-hairline bg-canvas-parchment shadow-sm">
              {message.sender?.profilePicture ? (
                <OptimizedImage
                  src={message.sender.profilePicture}
                  alt={message.sender.name}
                  width={32}
                  height={32}
                  isAvatar
                  className="h-full w-full object-cover"
                />
              ) : (
                <div className="h-full w-full flex items-center justify-center text-ink/20 font-bold text-xs">
                  {message.sender?.name.charAt(0).toUpperCase() || "?"}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Message Bubble */}
        <div className={cn(
          "px-4 py-2.5 rounded-lg text-body shadow-sm transition-all",
          isOwn 
            ? "bg-primary text-white rounded-br-none" 
            : "bg-canvas-parchment text-ink rounded-bl-none border border-hairline"
        )}>
          <p className="whitespace-pre-wrap break-words">
            {message.content}
          </p>
        </div>

        {/* Timestamp - visible on hover */}
        <div className={cn(
          "absolute top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap text-[10px] text-ink-muted-48 font-semibold",
          isOwn ? "-left-12" : "-right-12"
        )}>
          {format(message.createdAt, "h:mm a")}
        </div>
      </div>
      
      {/* Tiny timestamp always visible below (optional) */}
      {/* <span className="text-[9px] text-ink-muted-48 mt-1 px-1">
        {format(message.createdAt, "h:mm a")}
      </span> */}
    </div>
  )
}
