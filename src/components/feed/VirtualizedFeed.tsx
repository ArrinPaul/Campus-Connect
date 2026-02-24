"use client"

import { useRef, useCallback } from "react"
import { useVirtualizer } from "@tanstack/react-virtual"
import { PostCard } from "@/components/posts/PostCard"
import { InfiniteScrollTrigger } from "./InfiniteScrollTrigger"
import { Repeat2 } from "lucide-react"
import { api } from "@/convex/_generated/api"
import type { FunctionReturnType } from "convex/server"

type ConvexFeedItem = NonNullable<FunctionReturnType<typeof api.feed_ranking.getRankedFeed>>["items"][number] & {
  reposter?: { name?: string; username?: string } | null
  quoteContent?: string | null
}

interface VirtualizedFeedProps {
  items: ConvexFeedItem[]
  hasMore: boolean
  isLoadingMore: boolean
  onLoadMore: () => void
}

/**
 * Virtualized feed that only renders visible post cards.
 * Uses dynamic measurement to handle variable-height items.
 */
export function VirtualizedFeed({
  items,
  hasMore,
  isLoadingMore,
  onLoadMore,
}: VirtualizedFeedProps) {
  const parentRef = useRef<HTMLDivElement>(null)

  const virtualizer = useVirtualizer({
    count: items.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 280, // rough estimate for a post card
    overscan: 5,
    getItemKey: (index) => {
      const item = items[index]
      return item ? `${item.type}-${item._id}` : index
    },
  })

  const handleMeasure = useCallback(
    (node: HTMLElement | null) => {
      if (node) {
        virtualizer.measureElement(node)
      }
    },
    [virtualizer]
  )

  return (
    <div
      ref={parentRef}
      className="h-[calc(100vh-160px)] overflow-y-auto scrollbar-thin"
    >
      <div
        className="relative w-full"
        style={{ height: `${virtualizer.getTotalSize()}px` }}
      >
        {virtualizer.getVirtualItems().map((virtualItem) => {
          const item = items[virtualItem.index]
          if (!item) return null

          return (
            <div
              key={virtualItem.key}
              ref={handleMeasure}
              data-index={virtualItem.index}
              className="absolute left-0 w-full pb-3 sm:pb-4"
              style={{ top: `${virtualItem.start}px` }}
            >
              {item.type === "post" && item.post.author && (
                <PostCard post={item.post} author={item.post.author} />
              )}

              {(item as any).type === "repost" &&
                item.post.author &&
                (item as any).reposter && (
                  <div className="space-y-0">
                    <div className="flex items-center gap-2 px-4 pt-3 pb-1 text-xs font-medium text-accent-emerald">
                      <Repeat2 className="h-3.5 w-3.5" />
                      <span>
                        {(item as any).reposter.name || (item as any).reposter.username}{" "}
                        reposted
                      </span>
                    </div>
                    {(item as any).quoteContent && (
                      <div className="px-4 pb-2">
                        <p className="text-sm text-muted-foreground italic">
                          &ldquo;{(item as any).quoteContent}&rdquo;
                        </p>
                      </div>
                    )}
                    <PostCard
                      post={item.post}
                      author={item.post.author}
                    />
                  </div>
                )}
            </div>
          )
        })}
      </div>

      <InfiniteScrollTrigger
        onTrigger={onLoadMore}
        hasMore={hasMore}
        isLoading={isLoadingMore}
      />
    </div>
  )
}
