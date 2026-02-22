"use client"

import { useQuery } from "convex/react"
import { api } from "@/convex/_generated/api"
import Image from "next/image"
import { User } from "lucide-react"
import { useState, useEffect } from "react"

interface MentionUser {
  _id: string
  name: string
  username: string
  profilePicture?: string
}

interface MentionAutocompleteProps {
  query: string
  onSelect: (username: string) => void
  onClose: () => void
  position?: { top: number; left: number }
}

/**
 * MentionAutocomplete component
 * Displays a dropdown with user suggestions when typing @mentions
 * Features:
 * - Real-time search as you type
 * - Keyboard navigation (↑↓ to navigate, Enter to select, Escape to close)
 * - Avatar display for each user
 * - Click to select
 */
export function MentionAutocomplete({
  query,
  onSelect,
  onClose,
  position,
}: MentionAutocompleteProps) {
  const [selectedIndex, setSelectedIndex] = useState(0)

  // Query users based on the mention query
  const users = useQuery(
    api.users.searchUsersByUsername,
    query.trim().length > 0 ? { query, limit: 5 } : "skip"
  ) as MentionUser[] | undefined

  // Reset selected index when query or users change
  useEffect(() => {
    setSelectedIndex(0)
  }, [query, users])

  // Handle keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!users || users.length === 0) return

      switch (e.key) {
        case "ArrowDown":
          e.preventDefault()
          setSelectedIndex((prev) => (prev + 1) % users.length)
          break
        case "ArrowUp":
          e.preventDefault()
          setSelectedIndex((prev) => (prev - 1 + users.length) % users.length)
          break
        case "Enter":
          e.preventDefault()
          if (users[selectedIndex]) {
            onSelect(users[selectedIndex].username)
          }
          break
        case "Escape":
          e.preventDefault()
          onClose()
          break
      }
    }

    document.addEventListener("keydown", handleKeyDown)
    return () => document.removeEventListener("keydown", handleKeyDown)
  }, [users, selectedIndex, onSelect, onClose])

  // Don't render if still loading or no users found
  if (users === undefined || users.length === 0) {
    return null
  }

  return (
    <div
      className="absolute z-50 w-64 bg-card border border-border rounded-lg shadow-lg overflow-hidden"
      style={position ? { top: position.top, left: position.left } : undefined}
    >
      <div className="py-1">
        {users.map((user, index) => (
          <button
            key={user._id}
            onClick={() => onSelect(user.username)}
            onMouseEnter={() => setSelectedIndex(index)}
            className={`w-full px-4 py-2 flex items-center gap-3 hover:bg-accent transition-colors ${
              index === selectedIndex
                ? "bg-muted"
                : "bg-transparent"
            }`}
          >
            {user.profilePicture ? (
              <Image
                src={user.profilePicture}
                alt={user.name}
                width={32}
                height={32}
                className="w-8 h-8 rounded-full object-cover"
              />
            ) : (
              <div className="w-8 h-8 rounded-full bg-muted dark:bg-muted flex items-center justify-center">
                <User className="w-4 h-4 text-muted-foreground" />
              </div>
            )}
            <div className="flex-1 text-left">
              <div className="font-medium text-foreground text-sm">
                {user.name}
              </div>
              <div className="text-xs text-muted-foreground">
                @{user.username}
              </div>
            </div>
          </button>
        ))}
      </div>
    </div>
  )
}
