"use client"

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react"

/* ─── Types ──────────────────────────────────────────────────── */

type Politeness = "polite" | "assertive" | "off"

interface Announcement {
  id: number
  message: string
  politeness: Politeness
}

interface LiveRegionContextValue {
  /** Announce a message to screen readers (default: polite). */
  announce: (message: string, politeness?: Politeness) => void
}

/* ─── Context ────────────────────────────────────────────────── */

const LiveRegionContext = createContext<LiveRegionContextValue>({
  announce: () => {},
})

/* ─── Provider ───────────────────────────────────────────────── */

/**
 * LiveRegionProvider
 *
 * Wrap the app (or a subtree) with this provider to give child components
 * access to `useLiveRegion()`.  It renders two invisible ARIA live regions,
 * one for each politeness level, and routes announcements to the correct one.
 */
export function LiveRegionProvider({ children }: { children: React.ReactNode }) {
  const [politeMsg, setPoliteMsg] = useState("")
  const [assertiveMsg, setAssertiveMsg] = useState("")
  const politeTimer = useRef<NodeJS.Timeout | null>(null)
  const assertiveTimer = useRef<NodeJS.Timeout | null>(null)
  const idRef = useRef(0)

  const announce = useCallback((message: string, politeness: Politeness = "polite") => {
    if (!message) return

    if (politeness === "assertive") {
      if (assertiveTimer.current) clearTimeout(assertiveTimer.current)
      // Clear then re-set so screen readers always re-announce even for
      // repeated identical strings.
      setAssertiveMsg("")
      assertiveTimer.current = setTimeout(() => setAssertiveMsg(message), 50)
    } else {
      if (politeTimer.current) clearTimeout(politeTimer.current)
      setPoliteMsg("")
      politeTimer.current = setTimeout(() => setPoliteMsg(message), 50)
    }
  }, [])

  // Clear timers on unmount
  useEffect(() => {
    return () => {
      if (politeTimer.current) clearTimeout(politeTimer.current)
      if (assertiveTimer.current) clearTimeout(assertiveTimer.current)
    }
  }, [])

  return (
    <LiveRegionContext.Provider value={{ announce }}>
      {children}

      {/* ── Visually-hidden live regions ── */}
      <div
        role="status"
        aria-live="polite"
        aria-atomic="true"
        aria-relevant="additions text"
        className="sr-only"
      >
        {politeMsg}
      </div>
      <div
        role="alert"
        aria-live="assertive"
        aria-atomic="true"
        className="sr-only"
      >
        {assertiveMsg}
      </div>
    </LiveRegionContext.Provider>
  )
}

/* ─── Hook ───────────────────────────────────────────────────── */

/**
 * useLiveRegion
 *
 * Returns an `announce(message, politeness?)` function that pushes a message
 * into the appropriate ARIA live region so screen readers read it aloud.
 *
 * ```tsx
 * const { announce } = useLiveRegion()
 * announce("3 new notifications")         // polite
 * announce("Connection lost", "assertive") // interrupt
 * ```
 */
export function useLiveRegion() {
  return useContext(LiveRegionContext)
}
