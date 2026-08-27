"use client"

import { useQuery, useMutation } from "@/lib/api"
import { api } from "@/lib/api"
import { Id } from "@/lib/api"
import { useUser } from "@/lib/auth/client"
import { ChatMessage } from "./ChatMessage"
import { ChatInput } from "./ChatInput"
import { useEffect, useRef, useState } from "react"
import { Loader2, Phone, Video, MoreVertical, ArrowLeft } from "lucide-react"
import { OptimizedImage } from "@/components/ui/OptimizedImage"
import { OnlineStatusDot } from "@/components/ui/OnlineStatusDot"
import { useRouter } from "next/navigation"

interface ChatWindowProps {
  conversationId: Id<"conversations">
}

export function ChatWindow({ conversationId }: ChatWindowProps) {
  const { user: currentUser } = useUser()
  const router = useRouter()
  
  const rawMessages = useQuery(api.messages.getMessages, { conversationId })
  const conversation = useQuery(api.conversations.getConversation, { conversationId })
  const sendMessage = useMutation(api.messages.sendMessage)

  const [optimisticMessages, setOptimisticMessages] = useState<any[]>([])
  const scrollRef = useRef<HTMLDivElement>(null)

  // Merge server messages & local optimistic messages
  const messageList = Array.isArray(rawMessages)
    ? [...rawMessages, ...optimisticMessages.filter(om => !rawMessages.some(rm => rm.content === om.content && Math.abs((rm.createdAt || 0) - om.createdAt) < 5000))]
    : optimisticMessages

  // Scroll to bottom on new messages
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [messageList.length])

  const handleSendMessage = async (content: string) => {
    if (!currentUser) return
    const tempMsg = {
      _id: `temp_${Date.now()}`,
      senderId: currentUser.id,
      content,
      createdAt: Date.now(),
      sender: {
        _id: currentUser.id,
        name: currentUser.name || "You",
        profilePicture: (currentUser as any).profile_picture || currentUser.profilePicture,
      },
    }

    setOptimisticMessages((prev) => [...prev, tempMsg])

    try {
      await sendMessage({ conversationId, content })
    } catch (err) {
      console.error("Failed to send message:", err)
    }
  }

  const isLoading = conversation === undefined && rawMessages === undefined

  if (isLoading) {
    return (
      <div className="flex-1 flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary/40" />
      </div>
    )
  }

  const otherUser = conversation?.otherUser || {
    _id: "user",
    id: "user",
    name: conversation?.name || "Direct Message",
    profilePicture: undefined,
  }

  return (
    <div className="flex-1 flex flex-col bg-surface-soft min-w-0 h-full">
      {/* Top Bar Header */}
      <div className="h-16 bg-surface-soft border-b border-hairline px-4 md:px-6 flex items-center justify-between sticky top-0 z-20 shadow-sm">
        <div className="flex items-center gap-3">
          <button
            onClick={() => router.push("/messages")}
            className="md:hidden p-2 rounded-full text-muted-foreground hover:bg-accent hover:text-foreground transition-colors"
          >
            <ArrowLeft size={20} />
          </button>

          <div className="relative">
            <div className="h-10 w-10 rounded-full overflow-hidden border border-border bg-muted">
              {otherUser.profilePicture ? (
                <OptimizedImage
                  src={otherUser.profilePicture}
                  alt={otherUser.name || "User"}
                  width={40}
                  height={40}
                  isAvatar
                  className="h-full w-full object-cover"
                />
              ) : (
                <div className="h-full w-full flex items-center justify-center text-muted-foreground font-bold text-sm">
                  {(otherUser.name || "U").charAt(0).toUpperCase()}
                </div>
              )}
            </div>
            <OnlineStatusDot userId={otherUser._id || otherUser.id} size="sm" overlay />
          </div>

          <div>
            <h2 className="text-sm font-semibold text-foreground leading-snug">{otherUser.name}</h2>
            <p className="text-[10px] text-emerald-500 font-semibold tracking-wide uppercase">Active Now</p>
          </div>
        </div>

        <div className="flex items-center gap-1">
          <button className="p-2 rounded-full text-muted-foreground hover:text-primary hover:bg-accent transition-colors">
            <Phone size={18} />
          </button>
          <button className="p-2 rounded-full text-muted-foreground hover:text-primary hover:bg-accent transition-colors">
            <Video size={18} />
          </button>
          <button className="p-2 rounded-full text-muted-foreground hover:text-foreground hover:bg-accent transition-colors">
            <MoreVertical size={18} />
          </button>
        </div>
      </div>

      {/* Message Feed Area */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto py-6 space-y-2 scrollbar-custom">
        <div className="max-w-3xl mx-auto w-full">
          {/* Direct Message Welcome Header */}
          <div className="text-center mb-8 px-4">
            <div className="h-16 w-16 rounded-full overflow-hidden border border-border bg-card mx-auto mb-3 shadow-md">
              {otherUser.profilePicture ? (
                <OptimizedImage
                  src={otherUser.profilePicture}
                  alt={otherUser.name || "User"}
                  width={64}
                  height={64}
                  className="h-full w-full object-cover"
                />
              ) : (
                <div className="h-full w-full flex items-center justify-center text-muted-foreground font-bold text-xl">
                  {(otherUser.name || "U").charAt(0).toUpperCase()}
                </div>
              )}
            </div>
            <h3 className="text-base font-bold text-foreground">{otherUser.name}</h3>
            <p className="text-xs text-muted-foreground mt-0.5">Campus Connect Student & Peer</p>
            {otherUser._id && otherUser._id !== "user" && (
              <button
                onClick={() => router.push(`/profile/${otherUser._id || otherUser.id}`)}
                className="mt-2 text-xs text-primary font-medium hover:underline"
              >
                View Profile
              </button>
            )}
          </div>

          <div className="flex flex-col">
            {messageList.map((msg: any) => (
              <ChatMessage
                key={msg._id || msg.id}
                message={msg}
                isOwn={msg.senderId === currentUser?.id || msg.sender_id === currentUser?.id}
                showSenderInfo={false}
              />
            ))}
          </div>
        </div>
      </div>

      {/* Input Form Bar */}
      <div className="max-w-3xl mx-auto w-full">
        <ChatInput onSendMessage={handleSendMessage} />
      </div>
    </div>
  )
}

