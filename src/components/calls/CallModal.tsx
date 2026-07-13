"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import Image from "next/image"
import { useWebRTC } from "@/hooks/useWebRTC"
import { useMutation, useQuery } from "@/lib/api"
import { api } from "@/lib/api"
import { Id } from "@/lib/api"
import {
  Phone,
  PhoneOff,
  Video,
  VideoOff,
  Mic,
  MicOff,
  X,
  Monitor,
  Users,
} from "lucide-react"

interface CallModalProps {
  callId: Id<"calls">
  conversationId: Id<"conversations">
  isIncoming?: boolean
  callType: "audio" | "video"
  callerName: string
  callerProfilePicture?: string
  onClose: () => void
}

/**
 * Format call duration from seconds to mm:ss or hh:mm:ss
 */
function formatDuration(seconds: number): string {
  const hrs = Math.floor(seconds / 3600)
  const mins = Math.floor((seconds % 3600) / 60)
  const secs = seconds % 60
  if (hrs > 0) {
    return `${hrs}:${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`
  }
  return `${mins}:${secs.toString().padStart(2, "0")}`
}

export function CallModal({
  callId,
  conversationId,
  isIncoming = false,
  callType,
  callerName,
  callerProfilePicture,
  onClose,
}: CallModalProps) {
  const [isMuted, setIsMuted] = useState(false)
  const [isVideoOff, setIsVideoOff] = useState(callType === "audio")

  const [callDuration, setCallDuration] = useState(0)
  const [callState, setCallState] = useState<"ringing" | "connecting" | "active" | "ended">(
    isIncoming ? "ringing" : "connecting"
  )
  const timerRef = useRef<NodeJS.Timeout | null>(null)

  const {
    localVideoRef,
    remoteVideoRef,
    isMuted: isWebRTCMuted,
    isVideoOff: isWebRTCVideoOff,
    isScreenSharing,
    toggleMute: toggleWebRTCMute,
    toggleVideo: toggleWebRTCVideo,
    toggleScreenShare: toggleWebRTCScreenShare,
    startCall,
    cleanup,
  } = useWebRTC({
    callId: callId as string,
    isIncoming,
    callType,
    onCallEnded: () => setCallState("ended")
  })

  const acceptCall = useMutation(api.calls.acceptCall)
  const rejectCall = useMutation(api.calls.rejectCall)
  const endCall = useMutation(api.calls.endCall)

  // Watch call state via reactive query
  const activeCalls = useQuery(api.calls.getActiveCall, { conversationId })
  
  // getActiveCall returns an array of calls, so we need to find the one for this conversation
  const activeCall = Array.isArray(activeCalls) 
    ? activeCalls.find((c: any) => c.conversationId === conversationId || c.id === callId)
    : activeCalls;

  // Sync call state with backend
  useEffect(() => {
    if (!activeCall) {
      if (callState !== "ended") {
        setCallState("ended")
      }
      return
    }

    if (activeCall.status === "active" && callState !== "active") {
      setCallState("active")
    } else if (activeCall.status === "ringing" && !isIncoming && callState !== "connecting") {
      setCallState("connecting")
    } else if (
      activeCall.status === "ended" ||
      activeCall.status === "rejected" ||
      activeCall.status === "missed"
    ) {
      setCallState("ended")
    }
  }, [activeCalls, callState, isIncoming, conversationId, callId])

  // Start WebRTC when call connects
  useEffect(() => {
    if (callState === "active") {
      startCall()
    }
    if (callState === "ended") {
      cleanup()
    }
  }, [callState, startCall, cleanup])

  // Duration timer
  useEffect(() => {
    if (callState === "active") {
      timerRef.current = setInterval(() => {
        setCallDuration((prev) => prev + 1)
      }, 1000)
    } else {
      if (timerRef.current) {
        clearInterval(timerRef.current)
        timerRef.current = null
      }
    }

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current)
      }
    }
  }, [callState])

  // Auto-close after call ends
  useEffect(() => {
    if (callState === "ended") {
      const timeout = setTimeout(onClose, 2000)
      return () => clearTimeout(timeout)
    }
  }, [callState, onClose])

  const handleAccept = useCallback(async () => {
    try {
      setCallState("connecting")
      await acceptCall({ callId })
      setCallState("active")
    } catch {
      // Call may have ended
      setCallState("ended")
    }
  }, [acceptCall, callId])

  const handleReject = useCallback(async () => {
    try {
      await rejectCall({ callId })
    } catch {
      // Ignore errors
    }
    setCallState("ended")
  }, [rejectCall, callId])

  const handleEndCall = useCallback(async () => {
    try {
      await endCall({ callId })
    } catch {
      // Ignore errors
    }
    setCallState("ended")
  }, [endCall, callId])

  const toggleMute = useCallback(() => {
    setIsMuted((m) => !m)
    toggleWebRTCMute()
  }, [toggleWebRTCMute])
  
  const toggleVideo = useCallback(() => {
    setIsVideoOff((v) => !v)
    toggleWebRTCVideo()
  }, [toggleWebRTCVideo])
  
  const toggleScreenShare = useCallback(() => {
    toggleWebRTCScreenShare()
  }, [toggleWebRTCScreenShare])

  // Connected participants
  const connectedParticipants = activeCall?.participants?.filter(
    (p: any) => p.status === "connected"
  ) || []

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-background/95 backdrop-blur-sm">
      <div className="relative flex h-full w-full max-w-4xl flex-col items-center justify-between py-12 px-6">
        {/* Close button */}
        <button
          onClick={callState === "ended" ? onClose : handleEndCall}
          className="absolute right-4 top-4 rounded-full p-2 text-muted-foreground hover:bg-card hover:text-primary-foreground transition-colors"
          aria-label="Close"
        >
          <X className="h-6 w-6" />
        </button>

        {/* Call info section */}
        <div className="flex flex-col items-center gap-4">
          {/* Avatar */}
          <div className="relative">
            {callerProfilePicture ? (
              <Image
                src={callerProfilePicture}
                alt={callerName}
                width={112}
                height={112}
                className={`h-28 w-28 rounded-full object-cover ${
                  callState === "ringing" || callState === "connecting"
                    ? "animate-pulse ring-4 ring-ring/50"
                    : callState === "active"
                    ? "ring-4 ring-green-500/50"
                    : "ring-4 ring-border/60"
                }`}
              />
            ) : (
              <div
                className={`flex h-28 w-28 items-center justify-center rounded-full bg-primary text-4xl font-bold text-primary-foreground ${
                  callState === "ringing" || callState === "connecting"
                    ? "animate-pulse ring-4 ring-ring/50"
                    : callState === "active"
                    ? "ring-4 ring-green-500/50"
                    : "ring-4 ring-border/60"
                }`}
              >
                {callerName.charAt(0).toUpperCase()}
              </div>
            )}

            {/* Call type badge */}
            <div className="absolute -bottom-1 -right-1 rounded-full bg-card p-2">
              {callType === "video" ? (
                <Video className="h-4 w-4 text-primary" />
              ) : (
                <Phone className="h-4 w-4 text-green-400" />
              )}
            </div>
          </div>

          {/* Name */}
          <h2 className="text-2xl font-bold text-primary-foreground">{callerName}</h2>

          {/* Status text */}
          <p className="text-sm text-muted-foreground">
            {callState === "ringing" && isIncoming && "Incoming call..."}
            {callState === "ringing" && !isIncoming && "Calling..."}
            {callState === "connecting" && "Connecting..."}
            {callState === "active" && formatDuration(callDuration)}
            {callState === "ended" && "Call ended"}
          </p>

          {/* Connected participants count */}
          {callState === "active" && connectedParticipants.length > 0 && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Users className="h-4 w-4" />
              <span>{connectedParticipants.length} connected</span>
            </div>
          )}
        </div>

        {/* Video area (placeholder for WebRTC) */}
        {callType === "video" && callState === "active" && (
          <div className="flex flex-1 items-center justify-center w-full max-w-2xl my-8 relative">
            <div className="flex w-full h-full relative rounded-2xl overflow-hidden bg-black shadow-2xl">
              {/* Remote video */}
              <video
                ref={remoteVideoRef}
                autoPlay
                playsInline
                className="w-full h-full object-cover"
              />
              {!remoteVideoRef.current?.srcObject && (
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="text-center text-muted-foreground animate-pulse">
                    <Video className="h-12 w-12 mx-auto mb-2 opacity-50" />
                    <p className="text-sm">Connecting...</p>
                  </div>
                </div>
              )}

              {/* Local video (picture-in-picture style) */}
              {!isVideoOff && (
                <div className="absolute bottom-4 right-4 w-32 aspect-video rounded-xl bg-muted flex items-center justify-center border-2 border-border overflow-hidden shadow-lg z-10">
                  <video
                    ref={localVideoRef}
                    autoPlay
                    playsInline
                    muted
                    className="w-full h-full object-cover transform scale-x-[-1]"
                  />
                </div>
              )}
            </div>
          </div>
        )}

        {/* Controls */}
        <div className="flex items-center gap-4">
          {/* Incoming: Accept/Reject buttons */}
          {callState === "ringing" && isIncoming && (
            <>
              <button
                onClick={handleReject}
                className="flex h-16 w-16 items-center justify-center rounded-full bg-destructive text-primary-foreground shadow-lg shadow-red-600/30 hover:bg-red-700 transition-colors"
                aria-label="Reject call"
              >
                <PhoneOff className="h-7 w-7" />
              </button>

              <button
                onClick={handleAccept}
                className="flex h-16 w-16 items-center justify-center rounded-full bg-success text-primary-foreground shadow-lg shadow-green-600/30 hover:bg-green-700 transition-colors animate-pulse"
                aria-label="Accept call"
              >
                <Phone className="h-7 w-7" />
              </button>
            </>
          )}

          {/* Active/connecting: in-call controls */}
          {(callState === "active" || callState === "connecting") && (
            <>
              {/* Mute */}
              <button
                onClick={toggleMute}
                className={`flex h-12 w-12 items-center justify-center rounded-full transition-colors ${
                  isMuted
                    ? "bg-destructive/20 text-red-400 hover:bg-destructive/30"
                    : "bg-muted text-primary-foreground hover:bg-muted"
                }`}
                aria-label={isMuted ? "Unmute" : "Mute"}
              >
                {isMuted ? <MicOff className="h-5 w-5" /> : <Mic className="h-5 w-5" />}
              </button>

              {/* Video toggle */}
              {callType === "video" && (
                <button
                  onClick={toggleVideo}
                  className={`flex h-12 w-12 items-center justify-center rounded-full transition-colors ${
                    isVideoOff
                      ? "bg-destructive/20 text-red-400 hover:bg-destructive/30"
                      : "bg-muted text-primary-foreground hover:bg-muted"
                  }`}
                  aria-label={isVideoOff ? "Turn on video" : "Turn off video"}
                >
                  {isVideoOff ? <VideoOff className="h-5 w-5" /> : <Video className="h-5 w-5" />}
                </button>
              )}

              {/* Screen share */}
              {callType === "video" && (
                <button
                  onClick={toggleScreenShare}
                  className={`flex h-12 w-12 items-center justify-center rounded-full transition-colors ${
                    isScreenSharing
                      ? "bg-primary/20 text-primary hover:bg-primary/30"
                      : "bg-muted text-primary-foreground hover:bg-muted"
                  }`}
                  aria-label={isScreenSharing ? "Stop sharing" : "Share screen"}
                >
                  <Monitor className="h-5 w-5" />
                </button>
              )}

              {/* End call */}
              <button
                onClick={handleEndCall}
                className="flex h-14 w-14 items-center justify-center rounded-full bg-destructive text-primary-foreground shadow-lg shadow-red-600/30 hover:bg-red-700 transition-colors"
                aria-label="End call"
              >
                <PhoneOff className="h-6 w-6" />
              </button>
            </>
          )}

          {/* Ended state */}
          {callState === "ended" && (
            <p className="text-muted-foreground text-sm">
              {callDuration > 0
                ? `Call lasted ${formatDuration(callDuration)}`
                : "Call ended"}
            </p>
          )}
        </div>
      </div>
    </div>
  )
}

/**
 * Export formatDuration for use in call history and tests
 */
export { formatDuration }
