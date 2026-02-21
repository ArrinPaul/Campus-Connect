"use client"

import { useState } from "react"
import { useQuery, useMutation } from "convex/react"
import { api } from "@/../convex/_generated/api"
import { Id } from "@/../convex/_generated/dataModel"
import {
  X,
  Shield,
  ShieldCheck,
  Crown,
  UserMinus,
  UserPlus,
  LogOut,
  Edit2,
  Pin,
  ChevronDown,
  ChevronUp,
  Search,
  Check,
} from "lucide-react"

interface GroupInfoPanelProps {
  conversationId: Id<"conversations">
  onClose: () => void
}

/**
 * GroupInfoPanel
 * Slide-in panel showing group details, member list with roles,
 * admin controls, and pinned messages.
 */
export function GroupInfoPanel({ conversationId, onClose }: GroupInfoPanelProps) {
  const [showAddMember, setShowAddMember] = useState(false)
  const [addMemberSearch, setAddMemberSearch] = useState("")
  const [showMembers, setShowMembers] = useState(true)
  const [showPinned, setShowPinned] = useState(false)
  const [editingInfo, setEditingInfo] = useState(false)
  const [editName, setEditName] = useState("")
  const [editDescription, setEditDescription] = useState("")

  // Queries
  const conversation = useQuery(api.conversations.getConversation, {
    conversationId,
  })
  const pinnedMessages = useQuery(api.conversations.getPinnedMessages, {
    conversationId,
  })
  const searchResults = useQuery(
    api.users.searchUsers,
    addMemberSearch.trim().length >= 2 ? { query: addMemberSearch.trim() } : "skip"
  )

  // Mutations
  const updateGroupInfo = useMutation(api.conversations.updateGroupInfo)
  const addGroupMember = useMutation(api.conversations.addGroupMember)
  const removeGroupMember = useMutation(api.conversations.removeGroupMember)
  const promoteToAdmin = useMutation(api.conversations.promoteToAdmin)
  const demoteFromAdmin = useMutation(api.conversations.demoteFromAdmin)
  const leaveGroup = useMutation(api.conversations.leaveGroup)

  if (!conversation) return null

  const myRole = conversation.myRole
  const isOwner = myRole === "owner"
  const isAdmin = myRole === "admin" || isOwner

  const handleEditInfo = async () => {
    if (!editingInfo) {
      setEditName(conversation.name || "")
      setEditDescription(conversation.description || "")
      setEditingInfo(true)
      return
    }

    try {
      await updateGroupInfo({
        conversationId,
        name: editName.trim() || undefined,
        description: editDescription.trim(),
      })
      setEditingInfo(false)
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : "Unknown error")
    }
  }

  const handleAddMember = async (userId: Id<"users">) => {
    try {
      await addGroupMember({ conversationId, userId })
      setAddMemberSearch("")
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : "Unknown error")
    }
  }

  const handleRemoveMember = async (userId: Id<"users">) => {
    if (!confirm("Remove this member from the group?")) return
    try {
      await removeGroupMember({ conversationId, userId })
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : "Unknown error")
    }
  }

  const handlePromote = async (userId: Id<"users">) => {
    try {
      await promoteToAdmin({ conversationId, userId })
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : "Unknown error")
    }
  }

  const handleDemote = async (userId: Id<"users">) => {
    try {
      await demoteFromAdmin({ conversationId, userId })
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : "Unknown error")
    }
  }

  const handleLeaveGroup = async () => {
    if (!confirm("Are you sure you want to leave this group?")) return
    try {
      await leaveGroup({ conversationId })
      onClose()
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : "Unknown error")
    }
  }

  const getRoleBadge = (role?: string) => {
    switch (role) {
      case "owner":
        return (
          <span className="flex items-center gap-0.5 text-[10px] font-medium text-amber-600 dark:text-amber-400">
            <Crown className="h-3 w-3" /> Owner
          </span>
        )
      case "admin":
        return (
          <span className="flex items-center gap-0.5 text-[10px] font-medium text-primary">
            <ShieldCheck className="h-3 w-3" /> Admin
          </span>
        )
      default:
        return null
    }
  }

  const getInitials = (name: string) =>
    name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2)

  // Filter search results to exclude existing members
  const existingMemberIds = new Set(
    conversation.participants?.map((p) => p._id) || []
  )
  const filteredSearchResults = searchResults?.filter(
    (u) => !existingMemberIds.has(u._id)
  )

  return (
    <div className="fixed inset-y-0 right-0 z-40 w-80 bg-card border-l border-border shadow-xl flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-border">
        <h3 className="text-lg font-bold text-foreground">
          Group Info
        </h3>
        <button
          onClick={onClose}
          className="p-1 rounded-lg text-muted-foreground hover:text-muted-foreground hover:bg-muted dark:hover:text-muted-foreground hover:bg-accent"
        >
          <X className="h-5 w-5" />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto">
        {/* Group Header */}
        <div className="p-4 text-center border-b border-border">
          <div className="mx-auto h-16 w-16 rounded-full bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center mb-3">
            {conversation.avatar ? (
              <img
                src={conversation.avatar}
                alt={conversation.name || "Group"}
                className="h-16 w-16 rounded-full object-cover"
              />
            ) : (
              <span className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                {getInitials(conversation.name || "G")}
              </span>
            )}
          </div>

          {editingInfo ? (
            <div className="space-y-2">
              <input
                type="text"
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                className="w-full text-center text-sm px-3 py-1.5 rounded-lg border border-border bg-card bg-muted text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                maxLength={100}
              />
              <textarea
                value={editDescription}
                onChange={(e) => setEditDescription(e.target.value)}
                placeholder="Group description..."
                rows={2}
                className="w-full text-center text-xs px-3 py-1.5 rounded-lg border border-border bg-card bg-muted text-foreground focus:outline-none focus:ring-2 focus:ring-ring resize-none"
              />
              <div className="flex gap-2 justify-center">
                <button
                  onClick={handleEditInfo}
                  className="px-3 py-1 text-xs bg-primary text-primary-foreground rounded-lg hover:bg-primary/90"
                >
                  Save
                </button>
                <button
                  onClick={() => setEditingInfo(false)}
                  className="px-3 py-1 text-xs text-muted-foreground rounded-lg hover:bg-accent"
                >
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <>
              <h4 className="text-lg font-semibold text-foreground">
                {conversation.name}
              </h4>
              {conversation.description && (
                <p className="text-sm text-muted-foreground mt-1">
                  {conversation.description}
                </p>
              )}
              <p className="text-xs text-muted-foreground mt-1">
                {conversation.participants?.length || 0} members
              </p>
              {isAdmin && (
                <button
                  onClick={handleEditInfo}
                  className="mt-2 flex items-center gap-1 mx-auto text-xs text-primary hover:text-primary text-primary"
                >
                  <Edit2 className="h-3 w-3" /> Edit
                </button>
              )}
            </>
          )}
        </div>

        {/* Pinned Messages Section */}
        <div className="border-b border-border">
          <button
            onClick={() => setShowPinned(!showPinned)}
            className="w-full flex items-center justify-between px-4 py-3 text-sm font-medium text-foreground hover:bg-accent"
          >
            <span className="flex items-center gap-2">
              <Pin className="h-4 w-4" />
              Pinned Messages ({pinnedMessages?.length || 0})
            </span>
            {showPinned ? (
              <ChevronUp className="h-4 w-4" />
            ) : (
              <ChevronDown className="h-4 w-4" />
            )}
          </button>

          {showPinned && pinnedMessages && pinnedMessages.length > 0 && (
            <div className="px-4 pb-3 space-y-2">
              {pinnedMessages.map((msg) => (
                <div
                  key={msg._id}
                  className="p-2 bg-muted/50 bg-muted rounded-lg text-sm"
                >
                  <p className="text-xs font-medium text-muted-foreground">
                    {msg.senderName}
                  </p>
                  <p className="text-foreground text-xs mt-0.5 line-clamp-2">
                    {msg.content}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Members Section */}
        <div className="border-b border-border">
          <button
            onClick={() => setShowMembers(!showMembers)}
            className="w-full flex items-center justify-between px-4 py-3 text-sm font-medium text-foreground hover:bg-accent"
          >
            <span>Members ({conversation.participants?.length || 0})</span>
            {showMembers ? (
              <ChevronUp className="h-4 w-4" />
            ) : (
              <ChevronDown className="h-4 w-4" />
            )}
          </button>

          {showMembers && (
            <div className="px-2 pb-3">
              {/* Add member button (admin only) */}
              {isAdmin && (
                <div className="px-2 mb-2">
                  {showAddMember ? (
                    <div className="space-y-2">
                      <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3 w-3 text-muted-foreground" />
                        <input
                          type="text"
                          value={addMemberSearch}
                          onChange={(e) => setAddMemberSearch(e.target.value)}
                          placeholder="Search users..."
                          className="w-full pl-8 pr-3 py-1.5 text-xs rounded-lg border border-border bg-card text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring border-border bg-muted text-foreground"
                          autoFocus
                        />
                      </div>

                      {addMemberSearch.trim().length >= 2 && filteredSearchResults && (
                        <div className="max-h-32 overflow-y-auto border border-border rounded-lg">
                          {filteredSearchResults.length === 0 ? (
                            <p className="text-xs text-muted-foreground p-2">No users found</p>
                          ) : (
                            filteredSearchResults.map((user) => (
                              <button
                                key={user._id}
                                onClick={() => handleAddMember(user._id)}
                                className="w-full flex items-center gap-2 p-2 hover:bg-accent text-left"
                              >
                                <div className="h-6 w-6 rounded-full bg-muted dark:bg-muted flex items-center justify-center text-[8px] font-medium">
                                  {getInitials(user.name)}
                                </div>
                                <span className="text-xs text-foreground truncate">
                                  {user.name}
                                </span>
                              </button>
                            ))
                          )}
                        </div>
                      )}

                      <button
                        onClick={() => {
                          setShowAddMember(false)
                          setAddMemberSearch("")
                        }}
                        className="text-xs text-muted-foreground hover:text-foreground"
                      >
                        Cancel
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => setShowAddMember(true)}
                      className="w-full flex items-center gap-2 px-3 py-2 text-xs font-medium text-primary hover:bg-primary/10 text-primary hover:bg-primary/10 rounded-lg"
                    >
                      <UserPlus className="h-3.5 w-3.5" /> Add Member
                    </button>
                  )}
                </div>
              )}

              {/* Member list */}
              {conversation.participants?.map((member) => (
                <div
                  key={member._id}
                  className="flex items-center gap-2.5 px-2 py-2 rounded-lg hover:bg-accent group"
                >
                  {member.profilePicture ? (
                    <img
                      src={member.profilePicture}
                      alt={member.name}
                      className="h-8 w-8 rounded-full object-cover"
                    />
                  ) : (
                    <div className="h-8 w-8 rounded-full bg-muted dark:bg-muted flex items-center justify-center text-xs font-medium text-muted-foreground">
                      {getInitials(member.name)}
                    </div>
                  )}

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5">
                      <span className="text-sm font-medium text-foreground truncate">
                        {member.name}
                      </span>
                      {getRoleBadge(member.role)}
                    </div>
                    {member.username && (
                      <p className="text-[10px] text-muted-foreground">
                        @{member.username}
                      </p>
                    )}
                  </div>

                  {/* Admin actions */}
                  {isAdmin && member.role !== "owner" && (
                    <div className="hidden group-hover:flex items-center gap-1">
                      {isOwner && member.role !== "admin" && (
                        <button
                          onClick={() => handlePromote(member._id)}
                          title="Promote to admin"
                          className="p-1 rounded text-muted-foreground hover:text-primary hover:bg-muted dark:hover:bg-muted"
                        >
                          <ShieldCheck className="h-3.5 w-3.5" />
                        </button>
                      )}
                      {isOwner && member.role === "admin" && (
                        <button
                          onClick={() => handleDemote(member._id)}
                          title="Demote from admin"
                          className="p-1 rounded text-muted-foreground hover:text-amber-600 hover:bg-muted dark:hover:bg-muted"
                        >
                          <Shield className="h-3.5 w-3.5" />
                        </button>
                      )}
                      <button
                        onClick={() => handleRemoveMember(member._id)}
                        title="Remove member"
                        className="p-1 rounded text-muted-foreground hover:text-destructive hover:bg-muted dark:hover:bg-muted"
                      >
                        <UserMinus className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Leave Group */}
        <div className="p-4">
          <button
            onClick={handleLeaveGroup}
            className="w-full flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-medium text-destructive dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg border border-red-200 dark:border-red-900/30"
          >
            <LogOut className="h-4 w-4" />
            Leave Group
          </button>
        </div>
      </div>
    </div>
  )
}
