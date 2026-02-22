"use client"

import { useState, useMemo } from "react"
import { useQuery, useMutation } from "convex/react"
import { api } from "@/../convex/_generated/api"
import { Id } from "@/../convex/_generated/dataModel"
import { X, Search, Check, Users } from "lucide-react"

interface CreateGroupModalProps {
  onClose: () => void
  onCreated: (conversationId: Id<"conversations">) => void
}

/**
 * CreateGroupModal
 * Modal for creating a new group conversation.
 * Features: group name, description, member search/selection.
 */
export function CreateGroupModal({ onClose, onCreated }: CreateGroupModalProps) {
  const [groupName, setGroupName] = useState("")
  const [description, setDescription] = useState("")
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedMembers, setSelectedMembers] = useState<
    { _id: Id<"users">; name: string; username?: string; profilePicture?: string }[]
  >([])
  const [isCreating, setIsCreating] = useState(false)
  const [error, setError] = useState("")

  const createGroup = useMutation(api.conversations.createGroup)

  // Search users (reusing existing users.searchUsers query)
  const searchResults = useQuery(
    api.users.searchUsers,
    searchQuery.trim().length >= 2 ? { query: searchQuery.trim() } : "skip"
  )

  const filteredResults = useMemo(() => {
    if (!searchResults) return []
    return searchResults.filter(
      (user) => !selectedMembers.some((m) => m._id === user._id)
    )
  }, [searchResults, selectedMembers])

  const toggleMember = (user: {
    _id: Id<"users">
    name: string
    username?: string
    profilePicture?: string
  }) => {
    setSelectedMembers((prev) => {
      const exists = prev.some((m) => m._id === user._id)
      if (exists) return prev.filter((m) => m._id !== user._id)
      return [...prev, user]
    })
  }

  const removeMember = (userId: Id<"users">) => {
    setSelectedMembers((prev) => prev.filter((m) => m._id !== userId))
  }

  const handleCreate = async () => {
    if (!groupName.trim()) {
      setError("Group name is required")
      return
    }
    if (selectedMembers.length === 0) {
      setError("At least one member is required")
      return
    }

    setIsCreating(true)
    setError("")

    try {
      const conversationId = await createGroup({
        name: groupName.trim(),
        description: description.trim() || undefined,
        memberIds: selectedMembers.map((m) => m._id),
      })
      onCreated(conversationId)
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to create group")
    } finally {
      setIsCreating(false)
    }
  }

  const getInitials = (name: string) =>
    name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2)

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-foreground/20 backdrop-blur-sm">
      <div className="w-full max-w-lg mx-4 bg-card rounded-xl shadow-2xl max-h-[85vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-border">
          <h2 className="text-lg font-bold text-foreground">
            Create Group
          </h2>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-muted-foreground hover:text-muted-foreground hover:bg-muted dark:hover:text-muted-foreground hover:bg-accent"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {/* Group Name */}
          <div>
            <label className="block text-sm font-medium text-foreground mb-1">
              Group Name *
            </label>
            <input
              type="text"
              value={groupName}
              onChange={(e) => setGroupName(e.target.value)}
              placeholder="Enter group name..."
              maxLength={100}
              className="w-full px-3 py-2 text-sm rounded-lg border border-border bg-card text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring border-border bg-muted text-foreground"
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-foreground mb-1">
              Description (optional)
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="What is this group about?"
              rows={2}
              className="w-full px-3 py-2 text-sm rounded-lg border border-border bg-card text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring border-border bg-muted text-foreground resize-none"
            />
          </div>

          {/* Selected Members */}
          {selectedMembers.length > 0 && (
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Members ({selectedMembers.length})
              </label>
              <div className="flex flex-wrap gap-2">
                {selectedMembers.map((member) => (
                  <div
                    key={member._id}
                    className="flex items-center gap-1.5 bg-primary/10 text-primary rounded-full pl-1.5 pr-2 py-1"
                  >
                    {member.profilePicture ? (
                      <img
                        src={member.profilePicture}
                        alt={member.name}
                        className="h-5 w-5 rounded-full object-cover"
                      />
                    ) : (
                      <div className="h-5 w-5 rounded-full bg-primary/20 flex items-center justify-center text-[8px] font-bold text-primary">
                        {getInitials(member.name)}
                      </div>
                    )}
                    <span className="text-xs font-medium">{member.name}</span>
                    <button
                      onClick={() => removeMember(member._id)}
                      className="text-primary hover:text-primary"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Add Members Search */}
          <div>
            <label className="block text-sm font-medium text-foreground mb-1">
              Add Members
            </label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search by name or username..."
                className="w-full pl-9 pr-4 py-2 text-sm rounded-lg border border-border bg-card text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring border-border bg-muted text-foreground"
              />
            </div>

            {/* Search Results */}
            {searchQuery.trim().length >= 2 && (
              <div className="mt-2 border border-border rounded-lg max-h-48 overflow-y-auto">
                {!searchResults ? (
                  <div className="p-3 text-sm text-muted-foreground">Searching...</div>
                ) : filteredResults.length === 0 ? (
                  <div className="p-3 text-sm text-muted-foreground">No users found</div>
                ) : (
                  filteredResults.map((user) => {
                    const isSelected = selectedMembers.some(
                      (m) => m._id === user._id
                    )
                    return (
                      <button
                        key={user._id}
                        onClick={() =>
                          toggleMember({
                            _id: user._id,
                            name: user.name,
                            username: user.username,
                            profilePicture: user.profilePicture,
                          })
                        }
                        className="w-full flex items-center gap-3 p-3 hover:bg-accent text-left"
                      >
                        {user.profilePicture ? (
                          <img
                            src={user.profilePicture}
                            alt={user.name}
                            className="h-8 w-8 rounded-full object-cover"
                          />
                        ) : (
                          <div className="h-8 w-8 rounded-full bg-muted dark:bg-muted flex items-center justify-center text-xs font-medium text-muted-foreground">
                            {getInitials(user.name)}
                          </div>
                        )}
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-foreground truncate">
                            {user.name}
                          </p>
                          {user.username && (
                            <p className="text-xs text-muted-foreground">
                              @{user.username}
                            </p>
                          )}
                        </div>
                        {isSelected && (
                          <Check className="h-4 w-4 text-primary flex-shrink-0" />
                        )}
                      </button>
                    )
                  })
                )}
              </div>
            )}
          </div>

          {/* Error */}
          {error && (
            <p className="text-sm text-destructive dark:text-red-400">{error}</p>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 p-4 border-t border-border">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-foreground hover:text-foreground rounded-lg hover:bg-muted text-muted-foreground hover:bg-accent"
          >
            Cancel
          </button>
          <button
            onClick={handleCreate}
            disabled={isCreating || !groupName.trim() || selectedMembers.length === 0}
            className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-primary-foreground bg-primary rounded-lg hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Users className="h-4 w-4" />
            {isCreating ? "Creating..." : "Create Group"}
          </button>
        </div>
      </div>
    </div>
  )
}
