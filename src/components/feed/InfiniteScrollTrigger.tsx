"use client"

import { useEffect, useRef } from "react"

interface InfiniteScrollTriggerProps {
  onTrigger: () => void
  hasMore: boolean
  isLoading?: boolean
}

/**
 * InfiniteScrollTrigger component
 * Uses Intersection Observer API to detect when user scrolls to bottom
 * Triggers callback to load more content when visible
 * Validates: Requirements 6.4, 6.5
 */
export function InfiniteScrollTrigger({
  onTrigger,
  hasMore,
  isLoading = false,
}: InfiniteScrollTriggerProps) {
  const triggerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const currentTrigger = triggerRef.current
    if (!currentTrigger || !hasMore || isLoading) {
      return
    }

    // Create Intersection Observer
    const observer = new IntersectionObserver(
      (entries) => {
        const [entry] = entries
        // Trigger callback when element becomes visible
        if (entry.isIntersecting) {
          onTrigger()
        }
      },
      {
        root: null, // Use viewport as root
        rootMargin: "100px", // Trigger 100px before reaching the element
        threshold: 0.1, // Trigger when 10% of element is visible
      }
    )

    observer.observe(currentTrigger)

    // Cleanup observer on unmount
    return () => {
      if (currentTrigger) {
        observer.unobserve(currentTrigger)
      }
    }
  }, [onTrigger, hasMore, isLoading])

  // Don't render if there's no more content
  if (!hasMore) {
    return null
  }

  return (
    <div ref={triggerRef} className="py-8 text-center">
      {isLoading ? (
        <div className="flex items-center justify-center gap-2">
          <div className="h-5 w-5 animate-spin rounded-full border-2 border-border border-t-primary" />
          <span className="text-sm text-muted-foreground">Loading more posts...</span>
        </div>
      ) : (
        <div className="text-sm text-muted-foreground">Scroll for more</div>
      )}
    </div>
  )
}
