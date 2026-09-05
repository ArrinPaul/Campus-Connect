import type { RealtimeChannel } from "@supabase/supabase-js"
import { createLogger } from "@/lib/logger"

const log = createLogger("realtime-backoff")

const BASE_DELAY_MS = 1000
const MAX_DELAY_MS = 30000
const MAX_ATTEMPTS = 6

/**
 * Wraps a channel's `.subscribe()` status callback with exponential-backoff
 * reconnection on CHANNEL_ERROR/TIMED_OUT. Resubscribing the same channel
 * instance after a delay is the pattern Supabase's realtime-js docs
 * recommend for recovering a dropped subscription without re-registering
 * every `.on()` handler.
 *
 * Usage: pass the channel and your own status handler; call the returned
 * function from `.subscribe(handleStatus)` instead of your handler directly.
 * Call `.cancel()` from the effect's cleanup to stop any pending retry.
 */
export function withReconnect(
  channel: RealtimeChannel,
  onStatus?: (status: string) => void
): { handleStatus: (status: string) => void; cancel: () => void } {
  let attempt = 0
  let timeoutId: ReturnType<typeof setTimeout> | null = null
  let cancelled = false

  const cancel = () => {
    cancelled = true
    if (timeoutId) clearTimeout(timeoutId)
  }

  const handleStatus = (status: string) => {
    onStatus?.(status)

    if (status === "SUBSCRIBED") {
      attempt = 0
      return
    }

    if (cancelled) return
    if (status !== "CHANNEL_ERROR" && status !== "TIMED_OUT") return
    if (attempt >= MAX_ATTEMPTS) {
      log.error(`Giving up reconnecting channel "${channel.topic}" after ${MAX_ATTEMPTS} attempts`)
      return
    }

    const delay = Math.min(BASE_DELAY_MS * 2 ** attempt, MAX_DELAY_MS)
    attempt += 1
    log.info(`Realtime channel "${channel.topic}" ${status}, retrying in ${delay}ms (attempt ${attempt})`)
    timeoutId = setTimeout(() => {
      if (!cancelled) channel.subscribe(handleStatus)
    }, delay)
  }

  return { handleStatus, cancel }
}
