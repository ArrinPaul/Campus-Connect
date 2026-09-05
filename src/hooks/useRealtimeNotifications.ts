import { useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useQueryClient } from '@tanstack/react-query'
import { useUser } from '@/lib/auth/client'
import { createLogger } from '@/lib/logger'
import { withReconnect } from '@/lib/realtime-backoff'
import { toast } from 'sonner'

const log = createLogger('useRealtimeNotifications')

export function useRealtimeNotifications() {
  const queryClient = useQueryClient()
  const { user } = useUser()

  useEffect(() => {
    if (!user?.id) return

    const supabase = createClient()
    
    const channel = supabase
      .channel(`notifications:${user.id}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${user.id}`,
        },
        (payload) => {
          log.info('Realtime notification received', payload)
          
          // Invalidate notifications queries
          queryClient.invalidateQueries({
            queryKey: ['/api/notifications/unread-count'],
          })
          queryClient.invalidateQueries({
            queryKey: ['/api/notifications'],
          })

          // Optionally show a toast for the new notification if it has a message
          const newNotification = payload.new as any
          if (newNotification && newNotification.message) {
            toast(newNotification.message, {
              icon: '🔔',
            })
          }
        }
      )
      .on(
        'broadcast',
        { event: 'new_notification' },
        (payload) => {
          log.info('Realtime notification received (Broadcast)', payload)
          
          queryClient.invalidateQueries({
            queryKey: ['/api/notifications/unread-count'],
          })
          queryClient.invalidateQueries({
            queryKey: ['/api/notifications'],
          })

          const newNotification = payload.payload as any
          if (newNotification && newNotification.message) {
            toast(newNotification.message, {
              icon: '🔔',
            })
          }
        }
      )

    const reconnect = withReconnect(channel, (status) => {
      log.info(`Realtime notifications subscription status: ${status}`)
    })
    channel.subscribe(reconnect.handleStatus)

    return () => {
      reconnect.cancel()
      supabase.removeChannel(channel)
    }
  }, [user?.id, queryClient])
}
