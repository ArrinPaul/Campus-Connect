import { useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useQueryClient } from '@tanstack/react-query'
import { createLogger } from '@/lib/logger'

const log = createLogger('useRealtime')

export function useRealtimeMessages(conversationId: string) {
  const queryClient = useQueryClient()

  useEffect(() => {
    if (!conversationId) return

    const supabase = createClient()
    
    // Subscribe to new messages for this conversation
    const channel = supabase
      .channel(`messages:${conversationId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `conversation_id=eq.${conversationId}`,
        },
        (payload) => {
          log.info('Realtime message received (Postgres)', payload)
          queryClient.invalidateQueries({
            queryKey: ['/api/messages', { conversationId }],
          })
          queryClient.invalidateQueries({
            queryKey: ['/api/conversations'],
          })
        }
      )
      .on(
        'broadcast',
        { event: 'new_message' },
        (payload) => {
          log.info('Realtime message received (Broadcast)', payload)
          queryClient.invalidateQueries({
            queryKey: ['/api/messages', { conversationId }],
          })
          queryClient.invalidateQueries({
            queryKey: ['/api/conversations'],
          })
        }
      )
      .subscribe((status) => {
        log.info(`Realtime messages subscription status: ${status}`)
      })

    return () => {
      supabase.removeChannel(channel)
    }
  }, [conversationId, queryClient])
}
