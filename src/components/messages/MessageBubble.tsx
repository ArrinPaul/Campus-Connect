"use client"

import { useState } from "react"
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
    await deleteMessage({ messageId: message._id })
    setShowContextMenu(false)
  }

  const handleDeleteForEveryone = async () => {
    await deleteMessage({ messageId: message._id, deleteForEveryone: true })
    setShowContextMenu(false)
  }

  // System message
  if (message.messageType === "system") {
    return (
      <>
        {showTimestamp && (
          <div className="flex justify-center my-4">
            <span className="text-xs text-muted-foreground bg-muted bg-muted px-3 py-1 rounded-full">
              {formatDate(message.createdAt)}
            </span>
          </div>
        )}
        <div className="flex justify-center my-2">
          <span className="text-xs text-muted-foreground italic bg-muted px-3 py-1 rounded-full">
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
        <div className="max-w-[70%] px-4 py-2 rounded-2xl bg-muted bg-muted">
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
          <span className="text-xs text-muted-foreground bg-muted bg-muted px-3 py-1 rounded-full">
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
              <img
                src={message.senderAvatar}
                alt={message.senderName}
                className="h-7 w-7 rounded-full object-cover"
              />
            ) : (
              <div className="h-7 w-7 rounded-full bg-muted dark:bg-muted flex items-center justify-center text-[10px] font-medium text-muted-foreground">
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
            className={`relative px-4 py-2 rounded-2xl ${
              message.isOwn
                ? "bg-primary text-primary-foreground rounded-br-md"
                : "bg-muted bg-muted text-foreground rounded-bl-md"
            }`}
          >
            {/* Reply quote */}
            {message.replyToMessage && (
              <div
                className={`mb-2 pl-2 border-l-2 ${
                  message.isOwn
                    ? "border-blue-300 text-blue-100"
                    : "border-border text-muted-foreground"
                }`}
              >
                <p className="text-[10px] font-medium">
                  {message.replyToMessage.senderName}
                </p>
                <p className="text-xs truncate opacity-80">
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
                  <img
                    src={message.attachmentUrl}
                    alt="Image"
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
                          ? "text-blue-200 hover:text-blue-100"
                          : "text-primary hover:text-primary text-primary"
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
                  message.isOwn ? "text-blue-200" : "text-muted-foreground"
                }`}
              >
                {formatTime(message.createdAt)}
              </span>
              {message.updatedAt && (
                <span
                  className={`text-[10px] italic ${
                    message.isOwn ? "text-blue-200" : "text-muted-foreground"
                  }`}
                >
                  edited
                </span>
              )}
              {message.isOwn && (
                <span className="text-[10px]">
                  {message.status === "read" ? (
                    <CheckCheck className="h-3 w-3 text-blue-200" />
                  ) : message.status === "delivered" ? (
                    <CheckCheck className="h-3 w-3 text-blue-300/50" />
                  ) : (
                    <Check className="h-3 w-3 text-blue-300/50" />
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
            className="p-1 rounded-full text-muted-foreground hover:text-muted-foreground hover:bg-accent"
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
              className={`absolute top-full mt-1 z-20 w-44 rounded-lg bg-card bg-muted shadow-lg border border-border py-1 ${
                message.isOwn ? "right-0" : "left-0"
              }`}
            >
              <button
                onClick={() => {
                  onReply()
                  setShowContextMenu(false)
                }}
                className="w-full flex items-center gap-2 px-3 py-2 text-sm text-foreground text-foreground hover:bg-muted/50 dark:hover:bg-muted"
              >
                <Reply className="h-4 w-4" /> Reply
              </button>
              <button
                onClick={handleCopy}
                className="w-full flex items-center gap-2 px-3 py-2 text-sm text-foreground text-foreground hover:bg-muted/50 dark:hover:bg-muted"
              >
                <Copy className="h-4 w-4" /> Copy
              </button>
              <button
                onClick={handleDeleteForMe}
                className="w-full flex items-center gap-2 px-3 py-2 text-sm text-foreground text-foreground hover:bg-muted/50 dark:hover:bg-muted"
              >
                <Trash2 className="h-4 w-4" /> Delete for me
              </button>
              {canDeleteForEveryone && (
                <button
                  onClick={handleDeleteForEveryone}
                  className="w-full flex items-center gap-2 px-3 py-2 text-sm text-destructive dark:text-red-400 hover:bg-muted/50 dark:hover:bg-muted"
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
