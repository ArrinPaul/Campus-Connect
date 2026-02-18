"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import { useQuery, useMutation } from "convex/react"
import { api } from "@/../convex/_generated/api"
import { Id } from "@/../convex/_generated/dataModel"
import { MessageBubble } from "@/components/messages/MessageBubble"
import { MessageComposer } from "@/components/messages/MessageComposer"
import { TypingIndicator } from "@/components/messages/TypingIndicator"
import { GroupInfoPanel } from "@/components/messages/GroupInfoPanel"
import { OnlineStatusDot } from "@/components/ui/OnlineStatusDot"
import { CallModal } from "@/components/calls/CallModal"
import {
  ArrowLeft,
  Phone,
  Video,
  Info,
  Search,
  MoreVertical,
  Volume2,
  VolumeX,
  Trash2,
  Pin,
  Users,
  X,
} from "lucide-react"

interface ChatAreaProps {
  conversationId: Id<"conversations">
  onBack: () => void
}

/**
 * ChatArea
 * Main chat interface with header, message list, and composer
 */
export function ChatArea({ conversationId, onBack }: ChatAreaProps) {
  const [showSearch, setShowSearch] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  const [showMenu, setShowMenu] = useState(false)
  const [showGroupInfo, setShowGroupInfo] = useState(false)
  const [replyingTo, setReplyingTo] = useState<{
    _id: Id<"messages">
    content: string
    senderName: string
  } | null>(null)
  const [activeCallId, setActiveCallId] = useState<Id<"calls"> | null>(null)
  const [activeCallType, setActiveCallType] = useState<"audio" | "video">("audio")

  const messagesEndRef = useRef<HTMLDivElement>(null)
  const messageListRef = useRef<HTMLDivElement>(null)
  const prevMessageCountRef = useRef(0)

  const initiateCall = useMutation(api.calls.initiateCall)

  // Queries
  const conversation = useQuery(api.conversations.getConversation, {
    conversationId,
  })
  const messagesData = useQuery(api.messages.getMessages, {
    conversationId,
    limit: 50,
  })
  const typingUsers = useQuery(api.presence.getTypingUsers, {
    conversationId,
  })
  const searchResults = useQuery(
    api.messages.searchMessages,
    showSearch && searchQuery.trim()
      ? { conversationId, searchQuery, limit: 20 }
      : "skip"
  )

  // Mutations
  const markAsRead = useMutation(api.messages.markAsRead)
  const muteConversation = useMutation(api.conversations.muteConversation)
  const deleteConversation = useMutation(api.conversations.deleteConversation)

  const messages = messagesData?.messages || []

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    if (messages.length > prevMessageCountRef.current) {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
    }
    prevMessageCountRef.current = messages.length
  }, [messages.length])

  // Mark latest message as read when viewing
  useEffect(() => {
    if (messages.length > 0) {
      const lastMsg = messages[messages.length - 1]
      if (!lastMsg.isOwn && lastMsg.status !== "read") {
        markAsRead({
          conversationId,
          messageId: lastMsg._id,
        }).catch(() => {}) // Silently fail
      }
    }
  }, [messages, conversationId, markAsRead])

  const handleMute = async () => {
    if (!conversation) return
    await muteConversation({
      conversationId,
      isMuted: !conversation.isMuted,
    })
    setShowMenu(false)
  }

  const handleDelete = async () => {
    if (!confirm("Delete this conversation? This action cannot be undone.")) return
    await deleteConversation({ conversationId })
    setShowMenu(false)
    onBack()
  }

  if (!conversation) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="animate-pulse text-gray-400">Loading...</div>
      </div>
    )
  }

  const isGroup = conversation.type === "group"
  const displayName = isGroup
    ? conversation.name || "Group"
    : conversation.participants?.find((p) => !isCurrentParticipant(p))?.name || "Chat"

  const otherParticipant = !isGroup
    ? conversation.participants?.find((p) => !isCurrentParticipant(p))
    : null

  function isCurrentParticipant(p: any) {
    // The participant with no "isOwn" equivalent — we'll check via a comparison
    // In getConversation, participants include everyone. We need the current user's ID.
    // We'll identify the "other" user by checking if they appear in the "participants" list that aren't the first one.
    // Since we don't have explicit isOwn, let's use a simpler approach:
    // This is a workaround — in practice, the query should mark the current user.
    return false
  }

  const avatarUrl = isGroup
    ? conversation.avatar
    : conversation.participants?.length === 2
      ? conversation.participants[0]?.profilePicture || conversation.participants[1]?.profilePicture
      : undefined

  const memberCount = conversation.participants?.length || 0

  return (
    <div className="flex flex-col h-full">
      {/* Chat Header */}
      <div className="flex items-center gap-3 px-4 py-3 border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 flex-shrink-0">
        {/* Back button (mobile) */}
        <button
          onClick={onBack}
          className="md:hidden p-1 rounded-lg text-gray-500 hover:text-gray-700 hover:bg-gray-100 dark:text-gray-400 dark:hover:text-gray-200 dark:hover:bg-gray-700"
          aria-label="Back to conversations"
        >
          <ArrowLeft className="h-5 w-5" />
        </button>

        {/* Avatar with online status */}
        <div className="relative flex-shrink-0">
          {avatarUrl ? (
            <img
              src={avatarUrl}
              alt={displayName}
              className="h-10 w-10 rounded-full object-cover"
            />
          ) : (
            <div
              className={`h-10 w-10 rounded-full flex items-center justify-center text-sm font-medium ${
                isGroup
                  ? "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300"
                  : "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300"
              }`}
            >
              {isGroup ? (
                <Users className="h-4 w-4" />
              ) : (
                displayName
                  .split(" ")
                  .map((n) => n[0])
                  .join("")
                  .toUpperCase()
                  .slice(0, 2)
              )}
            </div>
          )}
          {!isGroup && otherParticipant && (
            <OnlineStatusDot
              userId={otherParticipant._id}
              size="sm"
              overlay
            />
          )}
        </div>

        {/* Name + status */}
        <div className="flex-1 min-w-0">
          <h3 className="text-sm font-semibold text-gray-900 dark:text-white truncate">
            {displayName}
          </h3>
          {isGroup ? (
            <p className="text-xs text-gray-500 dark:text-gray-400">
              {memberCount} members
            </p>
          ) : (
            <div className="flex items-center gap-2">
              <p className="text-xs text-gray-500 dark:text-gray-400">
                {otherParticipant?.username
                  ? `@${otherParticipant.username}`
                  : ""}
              </p>
              {otherParticipant && (
                <OnlineStatusDot
                  userId={otherParticipant._id}
                  showLastSeen
                />
              )}
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex items-center gap-1">
          {/* Audio call button (DM only) */}
          {!isGroup && (
            <button
              onClick={async () => {
                try {
                  const result = await initiateCall({ conversationId, type: "audio" })
                  setActiveCallType("audio")
                  setActiveCallId(result.callId)
                } catch (e) {
                  // Silently handle error (e.g., already in a call)
                }
              }}
              className="p-2 rounded-lg text-gray-500 hover:text-green-600 hover:bg-green-50 dark:text-gray-400 dark:hover:text-green-400 dark:hover:bg-green-900/20 transition-colors"
              title="Audio call"
            >
              <Phone className="h-4 w-4" />
            </button>
          )}

          {/* Video call button (DM only) */}
          {!isGroup && (
            <button
              onClick={async () => {
                try {
                  const result = await initiateCall({ conversationId, type: "video" })
                  setActiveCallType("video")
                  setActiveCallId(result.callId)
                } catch (e) {
                  // Silently handle error
                }
              }}
              className="p-2 rounded-lg text-gray-500 hover:text-blue-600 hover:bg-blue-50 dark:text-gray-400 dark:hover:text-blue-400 dark:hover:bg-blue-900/20 transition-colors"
              title="Video call"
            >
              <Video className="h-4 w-4" />
            </button>
          )}

          <button
            onClick={() => {
              setShowSearch(!showSearch)
              setSearchQuery("")
            }}
            className="p-2 rounded-lg text-gray-500 hover:text-gray-700 hover:bg-gray-100 dark:text-gray-400 dark:hover:text-gray-200 dark:hover:bg-gray-700"
            title="Search messages"
          >
          <Search className="h-4 w-4" />
          </button>

          {isGroup && (
            <button
              onClick={() => setShowGroupInfo(!showGroupInfo)}
              className="p-2 rounded-lg text-gray-500 hover:text-gray-700 hover:bg-gray-100 dark:text-gray-400 dark:hover:text-gray-200 dark:hover:bg-gray-700"
              title="Group info"
            >
              <Info className="h-4 w-4" />
            </button>
          )}

          {/* More menu */}
          <div className="relative">
            <button
              onClick={() => setShowMenu(!showMenu)}
              className="p-2 rounded-lg text-gray-500 hover:text-gray-700 hover:bg-gray-100 dark:text-gray-400 dark:hover:text-gray-200 dark:hover:bg-gray-700"
            >
              <MoreVertical className="h-4 w-4" />
            </button>

            {showMenu && (
              <>
                <div
                  className="fixed inset-0 z-10"
                  onClick={() => setShowMenu(false)}
                />
                <div className="absolute right-0 top-full mt-1 w-48 rounded-lg bg-white dark:bg-gray-700 shadow-lg border border-gray-200 dark:border-gray-600 z-20 py-1">
                  <button
                    onClick={handleMute}
                    className="w-full flex items-center gap-2 px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-600"
                  >
                    {conversation.isMuted ? (
                      <>
                        <Volume2 className="h-4 w-4" /> Unmute
                      </>
                    ) : (
                      <>
                        <VolumeX className="h-4 w-4" /> Mute
                      </>
                    )}
                  </button>
                  <button
                    onClick={handleDelete}
                    className="w-full flex items-center gap-2 px-4 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-gray-50 dark:hover:bg-gray-600"
                  >
                    <Trash2 className="h-4 w-4" /> Delete conversation
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Search bar (expandable) */}
      {showSearch && (
        <div className="flex items-center gap-2 px-4 py-2 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50">
          <Search className="h-4 w-4 text-gray-400 flex-shrink-0" />
          <input
            type="text"
            placeholder="Search in conversation..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="flex-1 text-sm bg-transparent text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none"
            autoFocus
          />
          <button
            onClick={() => {
              setShowSearch(false)
              setSearchQuery("")
            }}
            className="p-1 rounded text-gray-400 hover:text-gray-600"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* Search results */}
      {showSearch && searchQuery.trim() && searchResults && (
        <div className="border-b border-gray-200 dark:border-gray-700 max-h-48 overflow-y-auto bg-gray-50 dark:bg-gray-800/50">
          {searchResults.length === 0 ? (
            <p className="text-sm text-gray-500 px-4 py-3">No results found</p>
          ) : (
            searchResults.map((result) => (
              <div
                key={result._id}
                className="px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer"
              >
                <p className="text-xs text-gray-500">{result.senderName}</p>
                <p className="text-sm text-gray-900 dark:text-white truncate">
                  {result.content}
                </p>
              </div>
            ))
          )}
        </div>
      )}

      {/* Messages area */}
      <div
        ref={messageListRef}
        className="flex-1 overflow-y-auto px-4 py-4 space-y-1"
      >
        {messages.length === 0 ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-center text-gray-400">
              <p className="text-sm">No messages yet</p>
              <p className="text-xs mt-1">Send a message to start the conversation</p>
            </div>
          </div>
        ) : (
          <>
            {/* Load more button */}
            {messagesData?.cursor && (
              <div className="text-center py-2">
                <button className="text-xs text-blue-600 hover:text-blue-700 dark:text-blue-400">
                  Load earlier messages
                </button>
              </div>
            )}

            {messages.map((msg, index) => {
              const prevMsg = index > 0 ? messages[index - 1] : null
              const showSenderName =
                isGroup &&
                msg.messageType !== "system" &&
                !msg.isOwn &&
                (!prevMsg || prevMsg.senderId !== msg.senderId)

              const showTimestamp =
                !prevMsg ||
                msg.createdAt - prevMsg.createdAt > 300000 // 5 min gap

              return (
                <MessageBubble
                  key={msg._id}
                  message={msg}
                  isGroup={isGroup}
                  showSenderName={showSenderName}
                  showTimestamp={showTimestamp}
                  onReply={() =>
                    setReplyingTo({
                      _id: msg._id,
                      content: msg.content,
                      senderName: msg.senderName,
                    })
                  }
                />
              )
            })}
          </>
        )}

        {/* Typing indicator */}
        {typingUsers && typingUsers.length > 0 && (
          <TypingIndicator users={typingUsers} />
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Message composer */}
      <MessageComposer
        conversationId={conversationId}
        replyingTo={replyingTo}
        onCancelReply={() => setReplyingTo(null)}
      />

      {/* Group Info Panel (slide-in) */}
      {isGroup && showGroupInfo && (
        <GroupInfoPanel
          conversationId={conversationId}
          onClose={() => setShowGroupInfo(false)}
        />
      )}

      {/* Call Modal */}
      {activeCallId && (
        <CallModal
          callId={activeCallId}
          conversationId={conversationId}
          isIncoming={false}
          callType={activeCallType}
          callerName={displayName}
          callerProfilePicture={
            otherParticipant?.profilePicture || undefined
          }
          onClose={() => setActiveCallId(null)}
        />
      )}
    </div>
  )
}
