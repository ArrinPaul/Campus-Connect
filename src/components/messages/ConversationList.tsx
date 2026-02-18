"use client"

import { useState, useMemo } from "react"
import { Id } from "@/../convex/_generated/dataModel"
import { Search, Plus, Users, MessageSquare } from "lucide-react"

interface ConversationUser {
  _id: Id<"users">
  name: string
  username?: string
  profilePicture?: string
}

interface ConversationData {
  _id: Id<"conversations">
  type: "direct" | "group"
  name?: string
  avatar?: string
  lastMessagePreview?: string
  lastMessageAt?: number
  createdAt: number
  otherUsers: ConversationUser[]
  unreadCount: number
  isMuted: boolean
}

interface ConversationListProps {
  conversations: ConversationData[]
  selectedConversationId: Id<"conversations"> | null
  onSelectConversation: (id: Id<"conversations">) => void
  onCreateGroup: () => void
}

/**
 * ConversationList
 * Displays list of conversations with search, avatars, previews, and unread badges
 */
export function ConversationList({
  conversations,
  selectedConversationId,
  onSelectConversation,
  onCreateGroup,
}: ConversationListProps) {
  const [searchQuery, setSearchQuery] = useState("")

  const filteredConversations = useMemo(() => {
    if (!searchQuery.trim()) return conversations
    const q = searchQuery.toLowerCase()
    return conversations.filter((conv) => {
      if (conv.type === "group" && conv.name?.toLowerCase().includes(q)) return true
      return conv.otherUsers.some(
        (u) =>
          u.name.toLowerCase().includes(q) ||
          (u.username && u.username.toLowerCase().includes(q))
      )
    })
  }, [conversations, searchQuery])

  const formatTime = (timestamp: number) => {
    const now = Date.now()
    const diff = now - timestamp
    const minutes = Math.floor(diff / 60000)
    const hours = Math.floor(diff / 3600000)
    const days = Math.floor(diff / 86400000)

    if (minutes < 1) return "Now"
    if (minutes < 60) return `${minutes}m`
    if (hours < 24) return `${hours}h`
    if (days < 7) return `${days}d`
    return new Date(timestamp).toLocaleDateString(undefined, {
      month: "short",
      day: "numeric",
    })
  }

  const getDisplayName = (conv: ConversationData) => {
    if (conv.type === "group") return conv.name || "Group"
    if (conv.otherUsers.length > 0) return conv.otherUsers[0].name
    return "Unknown"
  }

  const getAvatarUrl = (conv: ConversationData) => {
    if (conv.type === "group") return conv.avatar
    if (conv.otherUsers.length > 0) return conv.otherUsers[0].profilePicture
    return undefined
  }

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2)
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="p-4 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">
            Messages
          </h2>
          <button
            onClick={onCreateGroup}
            className="p-2 rounded-lg text-gray-500 hover:text-blue-600 hover:bg-gray-100 dark:text-gray-400 dark:hover:text-blue-400 dark:hover:bg-gray-700 transition-colors"
            title="Create group"
          >
            <Users className="h-5 w-5" />
          </button>
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search conversations..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-sm rounded-lg border border-gray-200 bg-gray-50 text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:border-gray-600 dark:bg-gray-700 dark:text-white dark:placeholder-gray-400"
          />
        </div>
      </div>

      {/* Conversation List */}
      <div className="flex-1 overflow-y-auto">
        {filteredConversations.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
            <MessageSquare className="h-12 w-12 text-gray-300 dark:text-gray-600 mb-3" />
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {searchQuery
                ? "No conversations match your search"
                : "No conversations yet"}
            </p>
            {!searchQuery && (
              <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                Visit a user&apos;s profile to start a conversation
              </p>
            )}
          </div>
        ) : (
          filteredConversations.map((conv) => {
            const isSelected = selectedConversationId === conv._id
            const displayName = getDisplayName(conv)
            const avatarUrl = getAvatarUrl(conv)

            return (
              <button
                key={conv._id}
                onClick={() => onSelectConversation(conv._id)}
                className={`w-full flex items-center gap-3 px-4 py-3 text-left transition-colors hover:bg-gray-50 dark:hover:bg-gray-700 ${
                  isSelected
                    ? "bg-blue-50 dark:bg-blue-900/20 border-l-2 border-blue-500"
                    : "border-l-2 border-transparent"
                }`}
              >
                {/* Avatar */}
                <div className="relative flex-shrink-0">
                  {avatarUrl ? (
                    <img
                      src={avatarUrl}
                      alt={displayName}
                      className="h-12 w-12 rounded-full object-cover"
                    />
                  ) : (
                    <div
                      className={`h-12 w-12 rounded-full flex items-center justify-center text-sm font-medium ${
                        conv.type === "group"
                          ? "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300"
                          : "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300"
                      }`}
                    >
                      {conv.type === "group" ? (
                        <Users className="h-5 w-5" />
                      ) : (
                        getInitials(displayName)
                      )}
                    </div>
                  )}

                  {/* Unread badge */}
                  {conv.unreadCount > 0 && !conv.isMuted && (
                    <span className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-blue-600 text-[10px] font-bold text-white">
                      {conv.unreadCount > 99 ? "99+" : conv.unreadCount}
                    </span>
                  )}
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <span
                      className={`text-sm truncate ${
                        conv.unreadCount > 0
                          ? "font-semibold text-gray-900 dark:text-white"
                          : "font-medium text-gray-700 dark:text-gray-300"
                      }`}
                    >
                      {displayName}
                    </span>
                    {conv.lastMessageAt && (
                      <span className="text-xs text-gray-400 dark:text-gray-500 flex-shrink-0 ml-2">
                        {formatTime(conv.lastMessageAt)}
                      </span>
                    )}
                  </div>

                  {conv.lastMessagePreview && (
                    <p
                      className={`text-xs truncate mt-0.5 ${
                        conv.unreadCount > 0
                          ? "text-gray-700 dark:text-gray-300 font-medium"
                          : "text-gray-500 dark:text-gray-400"
                      }`}
                    >
                      {conv.lastMessagePreview}
                    </p>
                  )}

                  {/* Group member count */}
                  {conv.type === "group" && (
                    <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">
                      {conv.otherUsers.length + 1} members
                    </p>
                  )}
                </div>

                {/* Muted indicator */}
                {conv.isMuted && (
                  <span className="text-xs text-gray-400" title="Muted">
                    🔇
                  </span>
                )}
              </button>
            )
          })
        )}
      </div>
    </div>
  )
}
