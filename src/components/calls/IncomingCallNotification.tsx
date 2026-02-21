"use client"

import { useState, useEffect, useCallback } from "react"
import { useQuery, useMutation } from "convex/react"
import { api } from "@/../convex/_generated/api"
import { Id } from "@/../convex/_generated/dataModel"
import { Phone, PhoneOff, Video } from "lucide-react"
import { CallModal } from "./CallModal"

/**
 * Global component to listen for and display incoming call notifications.
 * Should be mounted in the dashboard layout so it's always active.
 */
export function IncomingCallNotification() {
  const incomingCalls = useQuery(api.calls.getIncomingCalls)
  const [activeCallId, setActiveCallId] = useState<Id<"calls"> | null>(null)
  const [dismissedCallIds, setDismissedCallIds] = useState<Set<string>>(new Set())

  const acceptCall = useMutation(api.calls.acceptCall)
  const rejectCall = useMutation(api.calls.rejectCall)

  // Filter out dismissed calls
  const pendingCalls = (incomingCalls || []).filter(
    (call) => !dismissedCallIds.has(call._id)
  )

  // If there's an active call modal, show it
  const activeCallData = activeCallId
    ? (incomingCalls || []).find((c) => c._id === activeCallId)
    : null

  const handleAccept = useCallback(
    async (callId: Id<"calls">) => {
      try {
        setActiveCallId(callId)
        await acceptCall({ callId })
      } catch {
        setActiveCallId(null)
      }
    },
    [acceptCall]
  )

  const handleReject = useCallback(
    async (callId: Id<"calls">) => {
      try {
        await rejectCall({ callId })
        setDismissedCallIds((prev) => {
          const next = new Set(prev)
          next.add(callId)
          return next
        })
      } catch {
        // Ignore
      }
    },
    [rejectCall]
  )

  const handleCloseCallModal = useCallback(() => {
    if (activeCallId) {
      setDismissedCallIds((prev) => {
        const next = new Set(prev)
        next.add(activeCallId)
        return next
      })
    }
    setActiveCallId(null)
  }, [activeCallId])

  // Clean up dismissed calls that are no longer in the list
  useEffect(() => {
    if (!incomingCalls) return
    const currentIds = new Set(incomingCalls.map((c) => c._id))
    setDismissedCallIds((prev) => {
      const next = new Set<string>()
      prev.forEach((id) => {
        if (currentIds.has(id)) next.add(id)
      })
      return next
    })
  }, [incomingCalls])

  // Show call modal if user accepted
  if (activeCallId && activeCallData) {
    return (
      <CallModal
        callId={activeCallId}
        conversationId={activeCallData.conversationId}
        isIncoming
        callType={activeCallData.type}
        callerName={activeCallData.callerName}
        callerProfilePicture={activeCallData.callerProfilePicture}
        onClose={handleCloseCallModal}
      />
    )
  }

  if (pendingCalls.length === 0) return null

  return (
    <>
      {pendingCalls.map((call) => (
        <div
          key={call._id}
          className="fixed top-4 right-4 z-[90] w-80 animate-in slide-in-from-top-2 fade-in duration-300"
        >
          <div className="rounded-2xl bg-card shadow-2xl border border-border overflow-hidden">
            {/* Header strip */}
            <div className="bg-gradient-to-r from-blue-600 to-blue-500 px-4 py-2">
              <p className="text-xs font-medium text-primary-foreground/80">
                Incoming {call.type === "video" ? "Video" : "Audio"} Call
              </p>
            </div>

            {/* Caller info */}
            <div className="flex items-center gap-3 p-4">
              {/* Avatar */}
              {call.callerProfilePicture ? (
                <img
                  src={call.callerProfilePicture}
                  alt={call.callerName}
                  className="h-12 w-12 rounded-full object-cover ring-2 ring-ring/30 animate-pulse"
                />
              ) : (
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary text-lg font-bold text-primary-foreground ring-2 ring-ring/30 animate-pulse">
                  {call.callerName.charAt(0).toUpperCase()}
                </div>
              )}

              <div className="flex-1 min-w-0">
                <p className="font-semibold text-foreground truncate">
                  {call.callerName}
                </p>
                <p className="text-xs text-muted-foreground truncate">
                  {call.conversationName !== call.callerName
                    ? call.conversationName
                    : call.type === "video" ? "Video call" : "Audio call"}
                </p>
              </div>

              {/* Call type icon */}
              <div className="flex-shrink-0">
                {call.type === "video" ? (
                  <Video className="h-5 w-5 text-primary" />
                ) : (
                  <Phone className="h-5 w-5 text-success" />
                )}
              </div>
            </div>

            {/* Action buttons */}
            <div className="flex border-t border-border">
              <button
                onClick={() => handleReject(call._id)}
                className="flex flex-1 items-center justify-center gap-2 py-3 text-sm font-medium text-destructive hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-900/20 transition-colors"
              >
                <PhoneOff className="h-4 w-4" />
                Decline
              </button>
              <div className="w-px bg-muted bg-muted" />
              <button
                onClick={() => handleAccept(call._id)}
                className="flex flex-1 items-center justify-center gap-2 py-3 text-sm font-medium text-success hover:bg-green-50 dark:text-green-400 dark:hover:bg-green-900/20 transition-colors"
              >
                <Phone className="h-4 w-4" />
                Accept
              </button>
            </div>
          </div>
        </div>
      ))}
    </>
  )
}
