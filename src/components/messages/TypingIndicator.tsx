"use client"

import { Id } from "@/../convex/_generated/dataModel"

interface TypingUser {
  _id: Id<"users">
  name: string
  username?: string
  profilePicture?: string
}

interface TypingIndicatorProps {
  users: TypingUser[]
}

/**
 * TypingIndicator
 * Shows animated typing dots with user names
 */
export function TypingIndicator({ users }: TypingIndicatorProps) {
  if (users.length === 0) return null

  const getTypingText = () => {
    if (users.length === 1) return `${users[0].name} is typing`
    if (users.length === 2) return `${users[0].name} and ${users[1].name} are typing`
    return `${users[0].name} and ${users.length - 1} others are typing`
  }

  return (
    <div className="flex items-center gap-2 py-1.5 px-1">
      {/* Animated dots */}
      <div className="flex items-center gap-0.5 bg-gray-100 dark:bg-gray-700 rounded-full px-3 py-2">
        <span
          className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce"
          style={{ animationDelay: "0ms", animationDuration: "1s" }}
        />
        <span
          className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce"
          style={{ animationDelay: "200ms", animationDuration: "1s" }}
        />
        <span
          className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce"
          style={{ animationDelay: "400ms", animationDuration: "1s" }}
        />
      </div>

      {/* Typing text */}
      <span className="text-xs text-gray-500 dark:text-gray-400 italic">
        {getTypingText()}...
      </span>
    </div>
  )
}
