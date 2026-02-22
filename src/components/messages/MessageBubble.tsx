"use client"

import { useState } from "react"
import Image from "next/image"
import { useMutation } from "convex/react"
import { api } from "@/../convex/_generated/api"
import { Id } from "@/../convex/_generated/dataModel"
import {
  Reply,
  Copy,
  Trash2,
  MoreHorizontal,
  Check,
  CheckCheck,
  FileText,
  ImageIcon,
  Pencil,
} from "lucide-react"

interface ReplyTo {
  _id: Id<"messages">
  content: string
  senderName: string
}

interface MessageData {
  _id: Id<"messages">
  conversationId: Id<"conversations">
  senderId: Id<"users">
  content: string
  messageType: "text" | "image" | "file" | "system"
  attachmentUrl?: string
  attachmentName?: string
  status: "sent" | "delivered" | "read"
  isDeleted: boolean
  isPinned?: boolean
  createdAt: number
  updatedAt?: number
  senderName: string
  senderUsername?: string
  senderAvatar?: string
  replyToMessage?: ReplyTo | null
  isOwn: boolean
}

interface MessageBubbleProps {
  message: MessageData
  isGroup: boolean
  showSenderName: boolean
  showTimestamp: boolean
  onReply: () => void
}

/**
 * MessageBubble
 * Displays a single message with appropriate styling for sent/received,
 * system messages, read receipts, reply quoting, and context menu.
 */
export function MessageBubble({
  message,
  isGroup,
  showSenderName,
  showTimestamp,
  onReply,
}: MessageBubbleProps) {
  const [showContextMenu, setShowContextMenu] = useState(false)

  const deleteMessage = useMutation(api.messages.deleteMessage)
  const editMessage = useMutation(api.messages.editMessage)

  const formatTime = (timestamp: number) => {
    return new Date(timestamp).toLocaleTimeString(undefined, {
      hour: "2-digit",
      minute: "2-digit",
    })
  }

  const formatDate = (timestamp: number) => {
    const date = new Date(timestamp)
    const today = new Date()
    const yesterday = new Date(today)
    yesterday.setDate(yesterday.getDate() - 1)

    if (date.toDateString() === today.toDateString()) return "Today"
    if (date.toDateString() === yesterday.toDateString()) return "Yesterday"
    return date.toLocaleDateString(undefined, {
      weekday: "long",
      month: "short",
      day: "numeric",
    })
  }

  const handleCopy = () => {
    navigator.clipboard.writeText(message.content)
    setShowContextMenu(false)
  }

  const handleDeleteForMe = async () => {
    try {
      await deleteMessage({ messageId: message._id })
    } catch (error) {
      console.error("Failed to delete message:", error)
    }
    setShowContextMenu(false)
  }

  const handleDeleteForEveryone = async () => {
    try {
      await deleteMessage({ messageId: message._id, deleteForEveryone: true })
    } catch (error) {
      console.error("Failed to delete message:", error)
    }
    setShowContextMenu(false)
  }

  // System message
  if (message.messageType === "system") {
    return (
      <>
        {showTimestamp && (
          <div className="flex justify-center my-4">
            <span className="text-xs text-muted-foreground bg-muted/80 backdrop-blur-sm px-3 py-1 rounded-full">
              {formatDate(message.createdAt)}
            </span>
          </div>
        )}
        <div className="flex justify-center my-2">
          <span className="text-xs text-muted-foreground italic bg-muted/60 px-3 py-1 rounded-full">
            {message.content}
          </span>
        </div>
      </>
    )
  }

  // Deleted message
  if (message.isDeleted) {
    return (
      <div
        className={`flex ${message.isOwn ? "justify-end" : "justify-start"} my-1`}
      >
        <div className="max-w-[70%] px-4 py-2 rounded-2xl bg-muted/60">
          <p className="text-sm text-muted-foreground italic">
            🚫 This message was deleted
          </p>
        </div>
      </div>
    )
  }

  const canDeleteForEveryone =
    message.isOwn && Date.now() - message.createdAt < 15 * 60 * 1000
  const canEdit =
    message.isOwn &&
    message.messageType === "text" &&
    Date.now() - message.createdAt < 15 * 60 * 1000

  return (
    <>
      {showTimestamp && (
        <div className="flex justify-center my-4">
          <span className="text-xs text-muted-foreground bg-muted/80 backdrop-blur-sm px-3 py-1 rounded-full">
            {formatDate(message.createdAt)}
          </span>
        </div>
      )}

      <div
        className={`flex ${message.isOwn ? "justify-end" : "justify-start"} group relative`}
      >
        {/* Avatar for non-own messages in groups */}
        {!message.isOwn && isGroup && showSenderName && (
          <div className="flex-shrink-0 mr-2 self-end">
            {message.senderAvatar ? (
              <Image
                src={message.senderAvatar}
                alt={message.senderName}
                width={28}
                height={28}
                className="h-7 w-7 rounded-full object-cover ring-1 ring-border/30"
              />
            ) : (
              <div className="h-7 w-7 rounded-full bg-gradient-to-br from-primary/20 to-accent-violet/20 flex items-center justify-center text-[10px] font-semibold text-foreground">
                {message.senderName[0]?.toUpperCase()}
              </div>
            )}
          </div>
        )}

        {/* Spacer for grouped messages without avatar */}
        {!message.isOwn && isGroup && !showSenderName && (
          <div className="w-9 flex-shrink-0" />
        )}

        <div className={`max-w-[70%] ${message.isOwn ? "items-end" : "items-start"}`}>
          {/* Sender name for groups */}
          {showSenderName && !message.isOwn && (
            <p className="text-xs font-medium text-muted-foreground mb-1 ml-1">
              {message.senderName}
            </p>
          )}

          {/* Message bubble */}
          <div
            className={`relative px-4 py-2.5 rounded-2xl transition-colors shadow-elevation-1 ${
              message.isOwn
                ? "bg-gradient-to-br from-primary via-primary/90 to-accent-rose/90 text-primary-foreground rounded-br-md"
                : "bg-card/80 border border-border/60 text-foreground rounded-bl-md"
            }`}
          >
            {/* Reply quote */}
            {message.replyToMessage && (
              <div
                className={`mb-2 pl-2.5 border-l-2 rounded-r-md py-1 ${
                  message.isOwn
                    ? "border-white/40 bg-white/10"
                    : "border-primary/40 bg-primary/5"
                }`}
              >
                <p className="text-[10px] font-semibold opacity-90">
                  {message.replyToMessage.senderName}
                </p>
                <p className="text-xs truncate opacity-70">
                  {message.replyToMessage.content}
                </p>
              </div>
            )}

            {/* Pinned indicator */}
            {message.isPinned && (
              <div className="flex items-center gap-1 mb-1">
                <span className="text-[10px] opacity-60">📌 Pinned</span>
              </div>
            )}

            {/* Content based on type */}
            {message.messageType === "text" && (
              <p className="text-sm whitespace-pre-wrap break-words">
                {message.content}
              </p>
            )}

            {message.messageType === "image" && (
              <div>
                {message.attachmentUrl && (
                  <Image
                    src={message.attachmentUrl}
                    alt="Image"
                    width={400}
                    height={300}
                    className="rounded-lg max-w-full max-h-64 object-cover mb-1"
                  />
                )}
                {message.content && (
                  <p className="text-sm mt-1">{message.content}</p>
                )}
              </div>
            )}

            {message.messageType === "file" && (
              <div className="flex items-center gap-2">
                <FileText className="h-5 w-5 flex-shrink-0" />
                <div className="min-w-0">
                  <p className="text-sm font-medium truncate">
                    {message.attachmentName || "Attachment"}
                  </p>
                  {message.attachmentUrl && (
                    <a
                      href={message.attachmentUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={`text-xs underline ${
                        message.isOwn
                          ? "text-primary-foreground/70 hover:text-primary-foreground"
                          : "text-primary hover:text-primary/80"
                      }`}
                    >
                      Download
                    </a>
                  )}
                </div>
              </div>
            )}

            {/* Time + status */}
            <div
              className={`flex items-center gap-1 mt-1 ${
                message.isOwn ? "justify-end" : "justify-start"
              }`}
            >
              <span
                className={`text-[10px] ${
                  message.isOwn ? "text-primary-foreground/60" : "text-muted-foreground"
                }`}
              >
                {formatTime(message.createdAt)}
              </span>
              {message.updatedAt && (
                <span
                  className={`text-[10px] italic ${
                    message.isOwn ? "text-primary-foreground/60" : "text-muted-foreground"
                  }`}
                >
                  edited
                </span>
              )}
              {message.isOwn && (
                <span className="text-[10px]">
                  {message.status === "read" ? (
                    <CheckCheck className="h-3 w-3 text-primary-foreground/70" />
                  ) : message.status === "delivered" ? (
                    <CheckCheck className="h-3 w-3 text-primary-foreground/40" />
                  ) : (
                    <Check className="h-3 w-3 text-primary-foreground/40" />
                  )}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Context menu button (hover) */}
        <div
          className={`self-center opacity-0 group-hover:opacity-100 transition-opacity ${
            message.isOwn ? "order-first mr-1" : "ml-1"
          }`}
        >
          <button
            onClick={() => setShowContextMenu(!showContextMenu)}
            className="p-1 rounded-full text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
            aria-label="Message options"
          >
            <MoreHorizontal className="h-4 w-4" />
          </button>
        </div>

        {/* Context menu dropdown */}
        {showContextMenu && (
          <>
            <div
              className="fixed inset-0 z-10"
              onClick={() => setShowContextMenu(false)}
            />
            <div
              className={`absolute top-full mt-1 z-20 w-44 rounded-xl bg-card shadow-elevation-2 border border-border/60 py-1 animate-fade-in-scale ${
                message.isOwn ? "right-0" : "left-0"
              }`}
            >
              <button
                onClick={() => {
                  onReply()
                  setShowContextMenu(false)
                }}
                className="w-full flex items-center gap-2.5 px-3 py-2 text-sm text-foreground hover:bg-muted transition-colors"
              >
                <Reply className="h-4 w-4" /> Reply
              </button>
              <button
                onClick={handleCopy}
                className="w-full flex items-center gap-2.5 px-3 py-2 text-sm text-foreground hover:bg-muted transition-colors"
              >
                <Copy className="h-4 w-4" /> Copy
              </button>
              <button
                onClick={handleDeleteForMe}
                className="w-full flex items-center gap-2.5 px-3 py-2 text-sm text-foreground hover:bg-muted transition-colors"
              >
                <Trash2 className="h-4 w-4" /> Delete for me
              </button>
              {canDeleteForEveryone && (
                <button
                  onClick={handleDeleteForEveryone}
                  className="w-full flex items-center gap-2.5 px-3 py-2 text-sm text-destructive hover:bg-destructive/10 transition-colors"
                >
                  <Trash2 className="h-4 w-4" /> Delete for everyone
                </button>
              )}
            </div>
          </>
        )}
      </div>
    </>
  )
}
