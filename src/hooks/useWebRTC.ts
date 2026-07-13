"use client"

import { useEffect, useRef, useState, useCallback } from "react"
import { createClient } from "@/lib/supabase/client"

export interface UseWebRTCProps {
  callId: string
  isIncoming: boolean
  callType: "audio" | "video"
  onCallEnded: () => void
}

export function useWebRTC({ callId, isIncoming, callType, onCallEnded }: UseWebRTCProps) {
  const [isMuted, setIsMuted] = useState(false)
  const [isVideoOff, setIsVideoOff] = useState(callType === "audio")
  const [isScreenSharing, setIsScreenSharing] = useState(false)
  
  const localVideoRef = useRef<HTMLVideoElement>(null)
  const remoteVideoRef = useRef<HTMLVideoElement>(null)
  
  const peerConnectionRef = useRef<RTCPeerConnection | null>(null)
  const localStreamRef = useRef<MediaStream | null>(null)
  
  // Use a ref to store the channel so we can clean it up later
  const channelRef = useRef<any>(null)
  const isStartedRef = useRef(false)

  const cleanup = useCallback(() => {
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach((track) => track.stop())
      localStreamRef.current = null
    }
    if (peerConnectionRef.current) {
      peerConnectionRef.current.close()
      peerConnectionRef.current = null
    }
    if (channelRef.current) {
      channelRef.current.unsubscribe()
      channelRef.current = null
    }
    if (localVideoRef.current) localVideoRef.current.srcObject = null
    if (remoteVideoRef.current) remoteVideoRef.current.srcObject = null
  }, [])

  const startCall = useCallback(async () => {
    if (isStartedRef.current) return
    isStartedRef.current = true

    try {
      // 1. Get User Media
      const stream = await navigator.mediaDevices.getUserMedia({
        video: callType === "video",
        audio: true,
      })
      localStreamRef.current = stream
      if (localVideoRef.current) {
        localVideoRef.current.srcObject = stream
      }

      // 2. Setup RTCPeerConnection
      const pc = new RTCPeerConnection({
        iceServers: [{ urls: "stun:stun.l.google.com:19302" }],
      })
      peerConnectionRef.current = pc

      // Add local tracks
      stream.getTracks().forEach((track) => {
        pc.addTrack(track, stream)
      })

      // Handle incoming remote tracks
      pc.ontrack = (event) => {
        if (remoteVideoRef.current && remoteVideoRef.current.srcObject !== event.streams[0]) {
          remoteVideoRef.current.srcObject = event.streams[0]
        }
      }

      // 3. Setup Supabase Realtime Signaling
      const supabase = createClient()
      const channel = supabase.channel(`call:${callId}`)
      channelRef.current = channel

      // Handle ICE Candidates
      pc.onicecandidate = (event) => {
        if (event.candidate) {
          channel.send({
            type: "broadcast",
            event: "ice-candidate",
            payload: { candidate: event.candidate, sender: isIncoming ? "callee" : "caller" },
          })
        }
      }

      channel
        .on("broadcast", { event: "ice-candidate" }, (payload) => {
          if (payload.payload.sender !== (isIncoming ? "callee" : "caller")) {
            pc.addIceCandidate(new RTCIceCandidate(payload.payload.candidate)).catch(console.error)
          }
        })
        .on("broadcast", { event: "sdp-offer" }, async (payload) => {
          if (isIncoming) { // Callee receives offer
            await pc.setRemoteDescription(new RTCSessionDescription(payload.payload.sdp))
            const answer = await pc.createAnswer()
            await pc.setLocalDescription(answer)
            channel.send({
              type: "broadcast",
              event: "sdp-answer",
              payload: { sdp: answer },
            })
          }
        })
        .on("broadcast", { event: "sdp-answer" }, async (payload) => {
          if (!isIncoming) { // Caller receives answer
            await pc.setRemoteDescription(new RTCSessionDescription(payload.payload.sdp))
          }
        })
        .subscribe(async (status) => {
          if (status === "SUBSCRIBED" && !isIncoming) {
            // Caller sends the offer
            const offer = await pc.createOffer()
            await pc.setLocalDescription(offer)
            channel.send({
              type: "broadcast",
              event: "sdp-offer",
              payload: { sdp: offer },
            })
          }
        })

    } catch (error) {
      console.error("Error starting WebRTC call:", error)
      onCallEnded()
    }
  }, [callId, callType, isIncoming, onCallEnded])

  const toggleMute = useCallback(() => {
    if (localStreamRef.current) {
      localStreamRef.current.getAudioTracks().forEach((track) => {
        track.enabled = !track.enabled
      })
      setIsMuted(!localStreamRef.current.getAudioTracks()[0]?.enabled)
    }
  }, [])

  const toggleVideo = useCallback(() => {
    if (localStreamRef.current && callType === "video") {
      localStreamRef.current.getVideoTracks().forEach((track) => {
        track.enabled = !track.enabled
      })
      setIsVideoOff(!localStreamRef.current.getVideoTracks()[0]?.enabled)
    }
  }, [callType])

  const toggleScreenShare = useCallback(async () => {
    if (!peerConnectionRef.current || callType !== "video") return;
    
    if (isScreenSharing) {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
        const videoTrack = stream.getVideoTracks()[0];
        const sender = peerConnectionRef.current.getSenders().find(s => s.track?.kind === 'video');
        if (sender) sender.replaceTrack(videoTrack);
        if (localStreamRef.current) {
          const oldTrack = localStreamRef.current.getVideoTracks()[0];
          if (oldTrack) {
            oldTrack.stop();
            localStreamRef.current.removeTrack(oldTrack);
          }
          localStreamRef.current.addTrack(videoTrack);
        }
        if (localVideoRef.current) localVideoRef.current.srcObject = localStreamRef.current;
        setIsScreenSharing(false);
        setIsVideoOff(false);
      } catch (err) {
        console.error("Failed to revert screen share:", err);
      }
    } else {
      try {
        const screenStream = await navigator.mediaDevices.getDisplayMedia({ video: true });
        const screenTrack = screenStream.getVideoTracks()[0];
        
        screenTrack.onended = () => {
          // Automatically revert when user stops sharing via browser UI
          toggleScreenShare();
        };
        
        const sender = peerConnectionRef.current.getSenders().find(s => s.track?.kind === 'video');
        if (sender) sender.replaceTrack(screenTrack);
        if (localStreamRef.current) {
          const oldTrack = localStreamRef.current.getVideoTracks()[0];
          if (oldTrack) {
            oldTrack.stop();
            localStreamRef.current.removeTrack(oldTrack);
          }
          localStreamRef.current.addTrack(screenTrack);
        }
        if (localVideoRef.current) localVideoRef.current.srcObject = localStreamRef.current;
        setIsScreenSharing(true);
        setIsVideoOff(false);
      } catch (err) {
        console.error("Failed to share screen:", err);
      }
    }
  }, [isScreenSharing, callType]);

  useEffect(() => {
    return () => {
      cleanup()
    }
  }, [cleanup])

  return {
    localVideoRef,
    remoteVideoRef,
    isMuted,
    isVideoOff,
    isScreenSharing,
    toggleMute,
    toggleVideo,
    toggleScreenShare,
    startCall,
    cleanup,
  }
}
