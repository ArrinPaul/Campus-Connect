"use client"

import { useState, useRef, useCallback, useEffect } from "react"
import { useMutation } from "convex/react"
import { api } from "@/../convex/_generated/api"
import { Id } from "@/../convex/_generated/dataModel"
import { Send, Paperclip, Smile, X, Image as ImageIcon, FileText } from "lucide-react"
import { createLogger } from "@/lib/logger"

const log = createLogger("MessageComposer")

interface ReplyTo {
  _id: Id<"messages">
  content: string
  senderName: string
}

interface MessageComposerProps {
  conversationId: Id<"conversations">
  replyingTo: ReplyTo | null
  onCancelReply: () => void
}

/**
 * MessageComposer
 * Text input with send button, typing indicator trigger, file upload button,
 * emoji picker, and reply indicator.
 */
export function MessageComposer({
  conversationId,
  replyingTo,
  onCancelReply,
}: MessageComposerProps) {
  const [content, setContent] = useState("")
  const [isSending, setIsSending] = useState(false)
  const [showEmojiPicker, setShowEmojiPicker] = useState(false)

  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  const sendMessage = useMutation(api.messages.sendMessage)
  const setTyping = useMutation(api.presence.setTyping)

  // Auto-resize textarea
  useEffect(() => {
    const textarea = textareaRef.current
    if (textarea) {
      textarea.style.height = "auto"
      textarea.style.height = `${Math.min(textarea.scrollHeight, 120)}px`
    }
  }, [content])

  // Focus on reply
  useEffect(() => {
    if (replyingTo) {
      textareaRef.current?.focus()
    }
  }, [replyingTo])

  // Handle typing indicator
  const handleTyping = useCallback(() => {
    setTyping({ conversationId, isTyping: true }).catch(() => {})

    // Clear previous timeout
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current)
    }

    // Set typing to false after 3 seconds of no input
    typingTimeoutRef.current = setTimeout(() => {
      setTyping({ conversationId, isTyping: false }).catch(() => {})
    }, 3000)
  }, [conversationId, setTyping])

  // Cleanup typing timeout on unmount
  useEffect(() => {
    return () => {
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current)
      }
    }
  }, [])

  const handleSend = async () => {
    const trimmed = content.trim()
    if (!trimmed || isSending) return

    setIsSending(true)
    try {
      await sendMessage({
        conversationId,
        content: trimmed,
        messageType: "text",
        replyToId: replyingTo?._id,
      })

      setContent("")
      onCancelReply()

      // Stop typing indicator
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current)
      }
      setTyping({ conversationId, isTyping: false }).catch(() => {})

      // Re-focus textarea
      textareaRef.current?.focus()
    } catch (error) {
      log.error("Failed to send message", error)
    } finally {
      setIsSending(false)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setContent(e.target.value)
    handleTyping()
  }

  // Common emojis for quick insert
  const quickEmojis = ["😀", "😂", "❤️", "👍", "🔥", "😊", "🎉", "💯", "🤔", "😢", "😍", "👏"]

  return (
    <div className="border-t border-border bg-card flex-shrink-0">
      {/* Reply indicator */}
      {replyingTo && (
        <div className="flex items-center gap-2 px-4 pt-2">
          <div className="flex-1 flex items-center gap-2 pl-3 py-1.5 border-l-2 border-primary bg-primary/10 rounded-r-lg">
            <div className="flex-1 min-w-0">
              <p className="text-xs font-medium text-primary">
                Replying to {replyingTo.senderName}
              </p>
              <p className="text-xs text-muted-foreground truncate">
                {replyingTo.content}
              </p>
            </div>
            <button
              onClick={onCancelReply}
              className="p-1 rounded-full text-muted-foreground hover:text-muted-foreground"
              aria-label="Cancel reply"
            >
              <X className="h-3 w-3" />
            </button>
          </div>
        </div>
      )}

      {/* Emoji picker */}
      {showEmojiPicker && (
        <div className="px-4 pt-2">
          <div className="flex flex-wrap gap-1 p-2 bg-muted/50 bg-muted rounded-lg">
            {quickEmojis.map((emoji) => (
              <button
                key={emoji}
                onClick={() => {
                  setContent((prev) => prev + emoji)
                  textareaRef.current?.focus()
                }}
                className="p-1.5 text-lg hover:bg-muted dark:hover:bg-muted rounded transition-colors"
                aria-label={`Insert ${emoji} emoji`}
              >
                {emoji}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Composer */}
      <div className="flex items-end gap-2 p-3">
        {/* Emoji button */}
        <button
          onClick={() => setShowEmojiPicker(!showEmojiPicker)}
          className="p-2 rounded-full text-muted-foreground hover:text-muted-foreground hover:bg-muted dark:hover:text-muted-foreground hover:bg-accent flex-shrink-0"
          title="Add emoji"
          aria-label="Add emoji"
        >
          <Smile className="h-5 w-5" />
        </button>

        {/* Attachment button */}
        <button
          className="p-2 rounded-full text-muted-foreground hover:text-muted-foreground hover:bg-muted dark:hover:text-muted-foreground hover:bg-accent flex-shrink-0"
          title="Attach file"
          aria-label="Attach file"
        >
          <Paperclip className="h-5 w-5" />
        </button>

        {/* Text input */}
        <div className="flex-1 relative">
          <textarea
            ref={textareaRef}
            value={content}
            onChange={handleChange}
            onKeyDown={handleKeyDown}
            placeholder="Type a message..."
            rows={1}
            className="w-full resize-none rounded-2xl border border-border bg-muted/50 px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent border-border bg-muted text-foreground dark:placeholder:text-muted-foreground"
            style={{ maxHeight: "120px" }}
          />
        </div>

        {/* Send button */}
        <button
          onClick={handleSend}
          disabled={!content.trim() || isSending}
          className={`p-2.5 rounded-full flex-shrink-0 transition-colors ${
            content.trim() && !isSending
              ? "bg-primary text-primary-foreground hover:bg-primary/90"
              : "bg-muted text-muted-foreground bg-muted dark:text-muted-foreground cursor-not-allowed"
          }`}
          title="Send message"
          aria-label="Send message"
        >
          <Send className="h-5 w-5" />
        </button>
      </div>
    </div>
  )
}
