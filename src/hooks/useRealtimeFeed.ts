import { useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useQueryClient } from '@tanstack/react-query'
import { createLogger } from '@/lib/logger'

const log = createLogger('useRealtimeFeed')

export function useRealtimeFeed() {
  const queryClient = useQueryClient()

  useEffect(() => {
    const supabase = createClient()
    
    // Subscribe to new posts
    const channel = supabase
      .channel('public:posts')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'posts',
        },
        (payload) => {
          log.info('Realtime post received (Postgres)', payload)
          // Invalidate feed queries to fetch the latest posts
          queryClient.invalidateQueries({
            queryKey: ['/api/posts/feed'],
          })
          queryClient.invalidateQueries({
            queryKey: ['/api/graph/recommendations'],
          })
          queryClient.invalidateQueries({
            queryKey: ['/api/posts/explore'],
          })
        }
      )
      .on(
        'broadcast',
        { event: 'new_post' },
        (payload) => {
          log.info('Realtime post received (Broadcast)', payload)
          queryClient.invalidateQueries({
            queryKey: ['/api/posts/feed'],
          })
          queryClient.invalidateQueries({
            queryKey: ['/api/graph/recommendations'],
          })
          queryClient.invalidateQueries({
            queryKey: ['/api/posts/explore'],
          })
        }
      )
      .subscribe((status) => {
        log.info(`Realtime feed subscription status: ${status}`)
      })

    return () => {
      supabase.removeChannel(channel)
    }
  }, [queryClient])
}
