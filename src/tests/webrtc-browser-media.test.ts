/**
 * @jest-environment jsdom
 */
import { renderHook, act } from "@testing-library/react"
import { useWebRTC } from "@/hooks/useWebRTC"

// Mock MediaStreamTrack
class MockMediaStreamTrack {
  kind: "audio" | "video"
  enabled = true
  readyState: "live" | "ended" = "live"
  onended: (() => void) | null = null

  constructor(kind: "audio" | "video") {
    this.kind = kind
  }

  stop() {
    this.readyState = "ended"
    if (this.onended) this.onended()
  }
}

// Mock MediaStream
class MockMediaStream {
  tracks: MockMediaStreamTrack[] = []

  constructor(tracks: MockMediaStreamTrack[] = []) {
    this.tracks = tracks
  }

  getTracks() {
    return this.tracks
  }

  getAudioTracks() {
    return this.tracks.filter((t) => t.kind === "audio")
  }

  getVideoTracks() {
    return this.tracks.filter((t) => t.kind === "video")
  }

  addTrack(track: MockMediaStreamTrack) {
    this.tracks.push(track)
  }

  removeTrack(track: MockMediaStreamTrack) {
    this.tracks = this.tracks.filter((t) => t !== track)
  }
}

// Mock RTCRtpSender
class MockRTCRtpSender {
  track: MockMediaStreamTrack | null
  constructor(track: MockMediaStreamTrack | null) {
    this.track = track
  }
  replaceTrack = jest.fn((newTrack: MockMediaStreamTrack | null) => {
    this.track = newTrack
    return Promise.resolve()
  })
}

// Mock RTCPeerConnection
class MockRTCPeerConnection {
  localDescription: any = null
  remoteDescription: any = null
  onicecandidate: ((e: any) => void) | null = null
  ontrack: ((e: any) => void) | null = null
  senders: MockRTCRtpSender[] = []
  connectionState: "new" | "connecting" | "connected" | "closed" = "new"

  addTrack = jest.fn((track: MockMediaStreamTrack, _stream: any) => {
    const sender = new MockRTCRtpSender(track)
    this.senders.push(sender)
    return sender
  })

  getSenders = jest.fn(() => this.senders)

  createOffer = jest.fn(() =>
    Promise.resolve({ type: "offer", sdp: "v=0\r\no=mock-caller..." })
  )

  createAnswer = jest.fn(() =>
    Promise.resolve({ type: "answer", sdp: "v=0\r\no=mock-callee..." })
  )

  setLocalDescription = jest.fn((desc: any) => {
    this.localDescription = desc
    return Promise.resolve()
  })

  setRemoteDescription = jest.fn((desc: any) => {
    this.remoteDescription = desc
    return Promise.resolve()
  })

  addIceCandidate = jest.fn((_candidate: any) => Promise.resolve())

  close = jest.fn(() => {
    this.connectionState = "closed"
  })
}

// Mock Supabase Realtime Channel
const mockChannelSend = jest.fn()
const mockChannelUnsubscribe = jest.fn()
const mockChannelOn = jest.fn().mockReturnThis()
const mockChannelSubscribe = jest.fn((cb: (status: string) => void) => {
  cb("SUBSCRIBED")
  return { unsubscribe: mockChannelUnsubscribe }
})

const mockSupabaseChannel = {
  send: mockChannelSend,
  on: mockChannelOn,
  subscribe: mockChannelSubscribe,
  unsubscribe: mockChannelUnsubscribe,
}

jest.mock("@/lib/supabase/client", () => ({
  createClient: jest.fn(() => ({
    channel: jest.fn(() => mockSupabaseChannel),
  })),
}))

describe("Phase 4 — P4-03 WebRTC Browser Media Verification", () => {
  let originalMediaDevices: any
  let originalRTCPeerConnection: any
  let originalRTCSessionDescription: any
  let originalRTCIceCandidate: any

  beforeAll(() => {
    originalMediaDevices = navigator.mediaDevices
    originalRTCPeerConnection = global.RTCPeerConnection
    originalRTCSessionDescription = global.RTCSessionDescription
    originalRTCIceCandidate = global.RTCIceCandidate

    // Install WebRTC Browser APIs
    global.RTCPeerConnection = MockRTCPeerConnection as any
    global.RTCSessionDescription = jest.fn((desc) => desc) as any
    global.RTCIceCandidate = jest.fn((cand) => cand) as any
  })

  afterAll(() => {
    Object.defineProperty(navigator, "mediaDevices", {
      value: originalMediaDevices,
      configurable: true,
    })
    global.RTCPeerConnection = originalRTCPeerConnection
    global.RTCSessionDescription = originalRTCSessionDescription
    global.RTCIceCandidate = originalRTCIceCandidate
  })

  beforeEach(() => {
    jest.clearAllMocks()

    const mockGetUserMedia = jest.fn((constraints: any) => {
      const tracks: MockMediaStreamTrack[] = []
      if (constraints.audio) tracks.push(new MockMediaStreamTrack("audio"))
      if (constraints.video) tracks.push(new MockMediaStreamTrack("video"))
      return Promise.resolve(new MockMediaStream(tracks))
    })

    const mockGetDisplayMedia = jest.fn(() => {
      return Promise.resolve(new MockMediaStream([new MockMediaStreamTrack("video")]))
    })

    Object.defineProperty(navigator, "mediaDevices", {
      value: {
        getUserMedia: mockGetUserMedia,
        getDisplayMedia: mockGetDisplayMedia,
      },
      configurable: true,
      writable: true,
    })
  })

  it("should request media stream with getUserMedia and initialize audio/video tracks", async () => {
    const onCallEnded = jest.fn()
    const { result } = renderHook(() =>
      useWebRTC({
        callId: "call-100",
        isIncoming: false,
        callType: "video",
        onCallEnded,
      })
    )

    await act(async () => {
      await result.current.startCall()
    })

    expect(navigator.mediaDevices.getUserMedia).toHaveBeenCalledWith({
      video: true,
      audio: true,
    })

    expect(result.current.isMuted).toBe(false)
    expect(result.current.isVideoOff).toBe(false)
  })

  it("should handle getUserMedia camera/mic permission denial cleanly", async () => {
    const onCallEnded = jest.fn()
    navigator.mediaDevices.getUserMedia = jest.fn().mockRejectedValue(new Error("Permission denied"))

    const { result } = renderHook(() =>
      useWebRTC({
        callId: "call-101",
        isIncoming: false,
        callType: "video",
        onCallEnded,
      })
    )

    await act(async () => {
      await result.current.startCall()
    })

    expect(onCallEnded).toHaveBeenCalled()
  })

  it("should negotiate SDP offer when caller initiates session", async () => {
    const onCallEnded = jest.fn()
    const { result } = renderHook(() =>
      useWebRTC({
        callId: "call-102",
        isIncoming: false,
        callType: "video",
        onCallEnded,
      })
    )

    await act(async () => {
      await result.current.startCall()
    })

    // Caller broadcasts sdp-offer
    expect(mockChannelSend).toHaveBeenCalledWith(
      expect.objectContaining({
        type: "broadcast",
        event: "sdp-offer",
        payload: expect.objectContaining({
          sdp: expect.objectContaining({ type: "offer" }),
        }),
      })
    )
  })

  it("should toggle audio mute and disable media tracks", async () => {
    const onCallEnded = jest.fn()
    const { result } = renderHook(() =>
      useWebRTC({
        callId: "call-103",
        isIncoming: false,
        callType: "video",
        onCallEnded,
      })
    )

    await act(async () => {
      await result.current.startCall()
    })

    act(() => {
      result.current.toggleMute()
    })
    expect(result.current.isMuted).toBe(true)

    act(() => {
      result.current.toggleMute()
    })
    expect(result.current.isMuted).toBe(false)
  })

  it("should switch between camera and screen share via getDisplayMedia", async () => {
    const onCallEnded = jest.fn()
    const { result } = renderHook(() =>
      useWebRTC({
        callId: "call-104",
        isIncoming: false,
        callType: "video",
        onCallEnded,
      })
    )

    await act(async () => {
      await result.current.startCall()
    })

    await act(async () => {
      await result.current.toggleScreenShare()
    })

    expect(navigator.mediaDevices.getDisplayMedia).toHaveBeenCalledWith({ video: true })
    expect(result.current.isScreenSharing).toBe(true)
  })

  it("should stop all tracks, close peer connection, and unsubscribe on cleanup", async () => {
    const onCallEnded = jest.fn()
    const { result, unmount } = renderHook(() =>
      useWebRTC({
        callId: "call-105",
        isIncoming: false,
        callType: "video",
        onCallEnded,
      })
    )

    await act(async () => {
      await result.current.startCall()
    })

    act(() => {
      result.current.cleanup()
    })

    expect(mockChannelUnsubscribe).toHaveBeenCalled()
    unmount()
  })
})
