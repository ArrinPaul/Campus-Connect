"use client"

import { useQuery, useMutation } from "@/lib/api"
import { api } from "@/lib/api"
import { Id } from "@/lib/api"
import { useUser } from "@/lib/auth/client"
import { ChatMessage } from "./ChatMessage"
import { ChatInput } from "./ChatInput"
import { useEffect, useRef, useState } from "react"
import { Loader2, User, MoreVertical, Phone, Video } from "lucide-react"
import { OptimizedImage } from "@/components/ui/OptimizedImage"
import { OnlineStatusDot } from "@/components/ui/OnlineStatusDot"
import { cn } from "@/lib/utils"

interface ChatWindowProps {
  conversationId: Id<"conversations">
}

export function ChatWindow({ conversationId }: ChatWindowProps) {
  const { user: currentUser } = useUser()
  const messages = useQuery(api.messages.getMessages, { conversationId })
  const conversation = useQuery(api.conversations.getConversation, { conversationId })
  const sendMessage = useMutation(api.messages.sendMessage)
  
  const scrollRef = useRef<HTMLDivElement>(null)

  // Scroll to bottom on new messages
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [messages])

  const handleSendMessage = async (content: string) => {
    try {
      await sendMessage({ conversationId, content })
    } catch (err) {
      console.error("Failed to send message:", err)
    }
  }

  if (conversation === undefined || messages === undefined) {
    return (
      <div className="flex-1 flex items-center justify-center bg-canvas">
        <Loader2 className="h-8 w-8 animate-spin text-ink/20" />
      </div>
    )
  }

  const otherUser = conversation.otherUser

  return (
    <div className="flex-1 flex flex-col bg-canvas min-w-0">
      {/* Header - Apple Frosted Style */}
      <div className="h-[64px] glass bg-canvas/80 border-b border-hairline px-4 md:px-8 flex items-center justify-between sticky top-0 z-20">
        <div className="flex items-center gap-3">
          <div className="relative">
            <div className="h-10 w-10 rounded-full overflow-hidden border border-hairline bg-canvas-parchment">
              {otherUser.profilePicture ? (
                <OptimizedImage
                  src={otherUser.profilePicture}
                  alt={otherUser.name}
                  width={40}
                  height={40}
                  isAvatar
                  className="h-full w-full object-cover"
                />
              ) : (
                <div className="h-full w-full flex items-center justify-center text-ink/20 font-bold text-sm">
                  {otherUser.name.charAt(0).toUpperCase()}
                </div>
              )}
            </div>
            <OnlineStatusDot userId={otherUser._id} size="sm" overlay />
          </div>
          <div>
            <h2 className="text-body-strong text-ink leading-tight">{otherUser.name}</h2>
            <p className="text-[10px] text-ink-muted-48 font-bold uppercase tracking-widest">
               Active Now
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button className="p-2 rounded-full text-primary hover:bg-primary/5 transition-colors btn-press">
            <Phone size={20} />
          </button>
          <button className="p-2 rounded-full text-primary hover:bg-primary/5 transition-colors btn-press">
            <Video size={20} />
          </button>
          <button className="p-2 rounded-full text-ink-muted-48 hover:bg-canvas-parchment hover:text-ink transition-colors btn-press">
            <MoreVertical size={20} />
          </button>
        </div>
      </div>

      {/* Message Feed */}
      <div 
        ref={scrollRef}
        className="flex-1 overflow-y-auto py-6 space-y-2 scrollbar-none"
      >
        <div className="max-w-3xl mx-auto w-full">
           <div className="text-center mb-8 px-4">
              <div className="h-16 w-16 rounded-full overflow-hidden border border-hairline bg-canvas-parchment mx-auto mb-3 shadow-sm">
                {otherUser.profilePicture ? (
                  <OptimizedImage src={otherUser.profilePicture} alt={otherUser.name} width={64} height={64} className="h-full w-full object-cover" />
                ) : (
                  <div className="h-full w-full flex items-center justify-center text-ink/10 font-display text-2xl">
                    {otherUser.name.charAt(0)}
                  </div>
                )}
              </div>
              <h3 className="text-display-md text-ink">{otherUser.name}</h3>
              <p className="text-caption text-ink-muted-48 mt-1">Academic Peer • Followed by you</p>
              <button className="mt-4 text-caption-strong text-primary hover:underline">View Profile</button>
           </div>
           
           <div className="flex flex-col">
            {messages.map((msg: any, i: number) => (
              <ChatMessage 
                key={msg._id} 
                message={msg} 
                isOwn={msg.senderId === currentUser?.id}
                showSenderInfo={false} 
              />
            ))}
           </div>
        </div>
      </div>

      {/* Input */}
      <div className="max-w-3xl mx-auto w-full">
        <ChatInput onSendMessage={handleSendMessage} />
      </div>
    </div>
  )
}
