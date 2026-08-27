"use client"

import { OptimizedImage } from "@/components/ui/OptimizedImage"
import { Id } from "@/lib/api"
import { format } from "date-fns"
import { cn } from "@/lib/utils"
import { FileText, Download, CheckCheck } from "lucide-react"

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
  const content = message.content || ""

  // Extract image markdown: ![Image](url)
  const imageMatch = content.match(/!\[Image\]\((.*?)\)/)
  const imageUrl = imageMatch ? imageMatch[1] : null

  // Extract file attachment markdown: [📎 filename](url)
  const fileMatch = content.match(/\[📎 (.*?)\]\((.*?)\)/)
  const fileName = fileMatch ? fileMatch[1] : null
  const fileUrl = fileMatch ? fileMatch[2] : null

  // Remove markdown tags from plain text portion
  const textContent = content
    .replace(/!\[Image\]\(.*?\)/g, "")
    .replace(/\[📎 .*?\]\(.*?\)/g, "")
    .trim()

  const formattedTime = message.createdAt ? format(message.createdAt, "h:mm a") : ""

  return (
    <div
      className={cn(
        "w-full flex flex-col mb-3 px-4 animate-in fade-in slide-in-from-bottom-2 duration-200",
        isOwn ? "items-end" : "items-start"
      )}
    >
      {/* Sender Name for group chats */}
      {!isOwn && showSenderInfo && message.sender && (
        <span className="text-[10px] text-muted-foreground font-semibold uppercase tracking-wider ml-1 mb-1">
          {message.sender.name}
        </span>
      )}

      <div
        className={cn(
          "flex max-w-[85%] md:max-w-[70%] group relative items-end gap-2",
          isOwn ? "flex-row-reverse" : "flex-row"
        )}
      >
        {/* Avatar for received messages */}
        {!isOwn && (
          <div className="flex-shrink-0 mb-0.5">
            <div className="h-8 w-8 rounded-full overflow-hidden border border-border bg-card shadow-sm">
              {message.sender?.profilePicture ? (
                <OptimizedImage
                  src={message.sender.profilePicture}
                  alt={message.sender.name || "User"}
                  width={32}
                  height={32}
                  isAvatar
                  className="h-full w-full object-cover"
                />
              ) : (
                <div className="h-full w-full flex items-center justify-center text-muted-foreground font-bold text-xs">
                  {(message.sender?.name || "U").charAt(0).toUpperCase()}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Message Bubble Container */}
        <div
          className={cn(
            "p-3.5 rounded-2xl text-sm shadow-sm transition-all overflow-hidden flex flex-col gap-2",
            isOwn
              ? "bg-primary text-primary-foreground rounded-br-xs"
              : "bg-card text-card-foreground border border-border/60 rounded-bl-xs"
          )}
        >
          {/* Image Attachment */}
          {imageUrl && (
            <div className="rounded-xl overflow-hidden border border-border/40 max-w-xs max-h-64 shadow-inner">
              <a href={imageUrl} target="_blank" rel="noopener noreferrer">
                <OptimizedImage
                  src={imageUrl}
                  alt="Attachment"
                  width={320}
                  height={240}
                  className="w-full h-full object-cover hover:scale-105 transition-transform duration-200"
                />
              </a>
            </div>
          )}

          {/* File Attachment */}
          {fileName && fileUrl && (
            <a
              href={fileUrl}
              target="_blank"
              rel="noopener noreferrer"
              className={cn(
                "flex items-center gap-3 p-2.5 rounded-xl border transition-colors",
                isOwn
                  ? "bg-primary-foreground/10 border-primary-foreground/20 text-primary-foreground hover:bg-primary-foreground/20"
                  : "bg-muted/50 border-border text-foreground hover:bg-muted"
              )}
            >
              <div className="p-2 rounded-lg bg-background/20">
                <FileText size={20} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-medium truncate">{fileName}</p>
                <p className="text-[10px] opacity-75">Click to download</p>
              </div>
              <Download size={16} className="opacity-75" />
            </a>
          )}

          {/* Text Message Content */}
          {textContent && (
            <p className="whitespace-pre-wrap break-words leading-relaxed">
              {textContent}
            </p>
          )}

          {/* Footer timestamp & status indicator inside bubble */}
          <div
            className={cn(
              "flex items-center justify-end gap-1 text-[10px] opacity-70 mt-0.5",
              isOwn ? "text-primary-foreground" : "text-muted-foreground"
            )}
          >
            <span>{formattedTime}</span>
            {isOwn && <CheckCheck size={13} className="opacity-90" />}
          </div>
        </div>
      </div>
    </div>
  )
}
