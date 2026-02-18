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
    } catch (err: any) {
      setError(err.message || "Failed to create group")
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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="w-full max-w-lg mx-4 bg-white dark:bg-gray-800 rounded-xl shadow-2xl max-h-[85vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-lg font-bold text-gray-900 dark:text-white">
            Create Group
          </h2>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 dark:hover:text-gray-300 dark:hover:bg-gray-700"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {/* Group Name */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Group Name *
            </label>
            <input
              type="text"
              value={groupName}
              onChange={(e) => setGroupName(e.target.value)}
              placeholder="Enter group name..."
              maxLength={100}
              className="w-full px-3 py-2 text-sm rounded-lg border border-gray-200 bg-white text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Description (optional)
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="What is this group about?"
              rows={2}
              className="w-full px-3 py-2 text-sm rounded-lg border border-gray-200 bg-white text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white resize-none"
            />
          </div>

          {/* Selected Members */}
          {selectedMembers.length > 0 && (
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Members ({selectedMembers.length})
              </label>
              <div className="flex flex-wrap gap-2">
                {selectedMembers.map((member) => (
                  <div
                    key={member._id}
                    className="flex items-center gap-1.5 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 rounded-full pl-1.5 pr-2 py-1"
                  >
                    {member.profilePicture ? (
                      <img
                        src={member.profilePicture}
                        alt={member.name}
                        className="h-5 w-5 rounded-full object-cover"
                      />
                    ) : (
                      <div className="h-5 w-5 rounded-full bg-blue-200 dark:bg-blue-800 flex items-center justify-center text-[8px] font-bold">
                        {getInitials(member.name)}
                      </div>
                    )}
                    <span className="text-xs font-medium">{member.name}</span>
                    <button
                      onClick={() => removeMember(member._id)}
                      className="text-blue-400 hover:text-blue-600"
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
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Add Members
            </label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search by name or username..."
                className="w-full pl-9 pr-4 py-2 text-sm rounded-lg border border-gray-200 bg-white text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
              />
            </div>

            {/* Search Results */}
            {searchQuery.trim().length >= 2 && (
              <div className="mt-2 border border-gray-200 dark:border-gray-600 rounded-lg max-h-48 overflow-y-auto">
                {!searchResults ? (
                  <div className="p-3 text-sm text-gray-400">Searching...</div>
                ) : filteredResults.length === 0 ? (
                  <div className="p-3 text-sm text-gray-400">No users found</div>
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
                        className="w-full flex items-center gap-3 p-3 hover:bg-gray-50 dark:hover:bg-gray-700 text-left"
                      >
                        {user.profilePicture ? (
                          <img
                            src={user.profilePicture}
                            alt={user.name}
                            className="h-8 w-8 rounded-full object-cover"
                          />
                        ) : (
                          <div className="h-8 w-8 rounded-full bg-gray-200 dark:bg-gray-600 flex items-center justify-center text-xs font-medium text-gray-600 dark:text-gray-300">
                            {getInitials(user.name)}
                          </div>
                        )}
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                            {user.name}
                          </p>
                          {user.username && (
                            <p className="text-xs text-gray-500 dark:text-gray-400">
                              @{user.username}
                            </p>
                          )}
                        </div>
                        {isSelected && (
                          <Check className="h-4 w-4 text-blue-600 flex-shrink-0" />
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
            <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 p-4 border-t border-gray-200 dark:border-gray-700">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-gray-700 hover:text-gray-900 rounded-lg hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700"
          >
            Cancel
          </button>
          <button
            onClick={handleCreate}
            disabled={isCreating || !groupName.trim() || selectedMembers.length === 0}
            className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Users className="h-4 w-4" />
            {isCreating ? "Creating..." : "Create Group"}
          </button>
        </div>
      </div>
    </div>
  )
}
