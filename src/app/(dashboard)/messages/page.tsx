"use client"

import { useState, useCallback } from "react"
import { useQuery } from "convex/react"
import { api } from "@/../convex/_generated/api"
import { Id } from "@/../convex/_generated/dataModel"
import { ConversationList } from "@/components/messages/ConversationList"
import { ChatArea } from "@/components/messages/ChatArea"
import { CreateGroupModal } from "@/components/messages/CreateGroupModal"
import { MessageSquare, ArrowLeft } from "lucide-react"

/**
 * Messages Page
 * Two-column layout: conversation list + chat area
 * Mobile: stack views with back button
 */
export default function MessagesPage() {
  const [selectedConversationId, setSelectedConversationId] = useState<
    Id<"conversations"> | null
  >(null)
  const [showCreateGroup, setShowCreateGroup] = useState(false)
  const [showMobileChat, setShowMobileChat] = useState(false)

  const conversations = useQuery(api.conversations.getConversations, {})

  const handleSelectConversation = useCallback(
    (conversationId: Id<"conversations">) => {
      setSelectedConversationId(conversationId)
      setShowMobileChat(true)
    },
    []
  )

  const handleBackToList = useCallback(() => {
    setShowMobileChat(false)
  }, [])

  const handleGroupCreated = useCallback((conversationId: Id<"conversations">) => {
    setSelectedConversationId(conversationId)
    setShowMobileChat(true)
    setShowCreateGroup(false)
  }, [])

  return (
    <div className="h-[calc(100vh-64px)] bg-gray-50 dark:bg-gray-900">
      <div className="mx-auto max-w-7xl h-full">
        <div className="flex h-full border-x border-gray-200 dark:border-gray-700">
          {/* Conversation List — hidden on mobile when chat is open */}
          <div
            className={`w-full md:w-80 lg:w-96 border-r border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 flex-shrink-0 ${
              showMobileChat ? "hidden md:flex md:flex-col" : "flex flex-col"
            }`}
          >
            <ConversationList
              conversations={conversations || []}
              selectedConversationId={selectedConversationId}
              onSelectConversation={handleSelectConversation}
              onCreateGroup={() => setShowCreateGroup(true)}
            />
          </div>

          {/* Chat Area — hidden on mobile when showing conversation list */}
          <div
            className={`flex-1 flex flex-col bg-white dark:bg-gray-800 ${
              showMobileChat ? "flex" : "hidden md:flex"
            }`}
          >
            {selectedConversationId ? (
              <ChatArea
                conversationId={selectedConversationId}
                onBack={handleBackToList}
              />
            ) : (
              <div className="flex-1 flex items-center justify-center">
                <div className="text-center text-gray-500 dark:text-gray-400">
                  <MessageSquare className="h-16 w-16 mx-auto mb-4 opacity-30" />
                  <h3 className="text-lg font-medium mb-1">No conversation selected</h3>
                  <p className="text-sm">
                    Choose a conversation from the list or start a new one
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Create Group Modal */}
      {showCreateGroup && (
        <CreateGroupModal
          onClose={() => setShowCreateGroup(false)}
          onCreated={handleGroupCreated}
        />
      )}
    </div>
  )
}
