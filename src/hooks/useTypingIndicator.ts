import { useEffect, useState, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useUser } from '@/lib/auth/client'
import { createLogger } from '@/lib/logger'

const log = createLogger('useTypingIndicator')

export function useTypingIndicator(conversationId: string) {
  const { user } = useUser()
  const [typingUsers, setTypingUsers] = useState<{ _id: any; name: string }[]>([])
  const [channel, setChannel] = useState<any>(null)

  useEffect(() => {
    if (!conversationId || !user) return

    const supabase = createClient()
    const presenceChannel = supabase.channel(`presence:typing:${conversationId}`)

    presenceChannel
      .on('presence', { event: 'sync' }, () => {
        const state = presenceChannel.presenceState()
        const users: { _id: any; name: string }[] = []
        for (const [key, presences] of Object.entries(state)) {
          if (presences && presences.length > 0) {
            const presence = presences[0] as any
            if (presence.isTyping && presence.userId !== user.id) {
              users.push({ _id: presence.userId, name: presence.userName || 'Someone' })
            }
          }
        }
        setTypingUsers(users)
      })
      .subscribe(async (status) => {
        if (status === 'SUBSCRIBED') {
          // Track initial status
          await presenceChannel.track({
            userId: user.id,
            userName: user.name,
            isTyping: false,
          })
        }
      })

    setChannel(presenceChannel)

    return () => {
      supabase.removeChannel(presenceChannel)
    }
  }, [conversationId, user])

  const setTyping = useCallback(
    async (isTyping: boolean) => {
      if (!channel || !user) return
      try {
        await channel.track({
          userId: user.id,
          userName: user.name,
          isTyping,
        })
      } catch (err) {
        log.error('Error tracking typing status', err)
      }
    },
    [channel, user]
  )

  return { typingUsers, setTyping }
}
