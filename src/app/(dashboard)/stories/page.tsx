"use client"

import { useEffect, useRef, useCallback, useState } from "react"
import { useQuery, useMutation } from "convex/react"
import { api } from "@/convex/_generated/api"
import { useRouter, useSearchParams } from "next/navigation"
import Image from "next/image"
import { X, Trash2, ChevronLeft, ChevronRight, Eye } from "lucide-react"
import { cn } from "@/lib/utils"
import Link from "next/link"
import { createLogger } from "@/lib/logger"
import { Id } from "@/convex/_generated/dataModel"

const log = createLogger("stories/page")

const STORY_DURATION_MS = 5000 // 5 seconds per story

export default function StoriesPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const startUserId = searchParams.get("userId")

  const allStories = useQuery(api.stories.getStories)
  const viewStory = useMutation(api.stories.viewStory)
  const deleteStory = useMutation(api.stories.deleteStory)
  const currentUser = useQuery(api.users.getCurrentUser)

  // Group stories by author
  const storyGroups = groupStoriesByAuthor(allStories ?? [])

  // Determine starting group index from ?userId param
  const initialGroupIndex = startUserId
    ? Math.max(0, storyGroups.findIndex((g) => g.authorId === startUserId))
    : 0

  const [groupIndex, setGroupIndex] = useState(initialGroupIndex)
  const [storyIndex, setStoryIndex] = useState(0)
  const [isPaused, setIsPaused] = useState(false)
  const [progress, setProgress] = useState(0)

  const progressRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const touchStartXRef = useRef<number | null>(null)
  const touchStartYRef = useRef<number | null>(null)

  const currentGroup = storyGroups[groupIndex]
  const currentStory = currentGroup?.stories[storyIndex]

  // View story when it becomes current
  useEffect(() => {
    if (currentStory && !currentStory.viewed) {
      viewStory({ storyId: currentStory._id as Id<"stories"> }).catch(() => {})
    }
    setProgress(0)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentStory?._id])

  // Auto-advance timer
  useEffect(() => {
    if (!currentStory || isPaused) return

    if (progressRef.current) clearInterval(progressRef.current)

    const startTime = Date.now()
    progressRef.current = setInterval(() => {
      const elapsed = Date.now() - startTime
      const pct = Math.min(100, (elapsed / STORY_DURATION_MS) * 100)
      setProgress(pct)

      if (elapsed >= STORY_DURATION_MS) {
        clearInterval(progressRef.current!)
        advanceStory()
      }
    }, 50)

    return () => {
      if (progressRef.current) clearInterval(progressRef.current)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentStory?._id, isPaused])

  const advanceStory = useCallback(() => {
    setProgress(0)
    if (!currentGroup) return

    if (storyIndex < currentGroup.stories.length - 1) {
      setStoryIndex((i) => i + 1)
    } else {
      // Advance to next group
      if (groupIndex < storyGroups.length - 1) {
        setGroupIndex((g) => g + 1)
        setStoryIndex(0)
      } else {
        // All stories done
        router.push("/feed")
      }
    }
  }, [currentGroup, groupIndex, storyGroups.length, storyIndex, router])

  const rewindStory = useCallback(() => {
    setProgress(0)
    if (storyIndex > 0) {
      setStoryIndex((i) => i - 1)
    } else if (groupIndex > 0) {
      setGroupIndex((g) => g - 1)
      setStoryIndex(0)
    }
  }, [storyIndex, groupIndex])

  const goToPrevGroup = useCallback(() => {
    if (groupIndex > 0) {
      setGroupIndex((g) => g - 1)
      setStoryIndex(0)
      setProgress(0)
    }
  }, [groupIndex])

  const goToNextGroup = useCallback(() => {
    if (groupIndex < storyGroups.length - 1) {
      setGroupIndex((g) => g + 1)
      setStoryIndex(0)
      setProgress(0)
    } else {
      router.push("/feed")
    }
  }, [groupIndex, storyGroups.length, router])

  // Keyboard navigation
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight") advanceStory()
      else if (e.key === "ArrowLeft") rewindStory()
      else if (e.key === "ArrowDown") goToNextGroup()
      else if (e.key === "ArrowUp") goToPrevGroup()
      else if (e.key === "Escape") router.push("/feed")
      else if (e.key === " ") setIsPaused((p) => !p)
    }
    window.addEventListener("keydown", handleKey)
    return () => window.removeEventListener("keydown", handleKey)
  }, [advanceStory, rewindStory, goToNextGroup, goToPrevGroup, router])

  // Touch support
  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartXRef.current = e.touches[0].clientX
    touchStartYRef.current = e.touches[0].clientY
    setIsPaused(true)
  }

  const handleTouchEnd = (e: React.TouchEvent) => {
    setIsPaused(false)
    if (touchStartXRef.current === null || touchStartYRef.current === null) return

    const dx = e.changedTouches[0].clientX - touchStartXRef.current
    const dy = e.changedTouches[0].clientY - touchStartYRef.current

    if (Math.abs(dy) > Math.abs(dx) && Math.abs(dy) > 50) {
      // Vertical swipe — change user
      if (dy < 0) goToNextGroup()
      else goToPrevGroup()
    } else if (Math.abs(dx) > 30) {
      // Horizontal swipe
      if (dx < 0) advanceStory()
      else rewindStory()
    }

    touchStartXRef.current = null
    touchStartYRef.current = null
  }

  const handleDelete = async () => {
    if (!currentStory) return
    if (!confirm("Delete this story?")) return
    try {
      await deleteStory({ storyId: currentStory._id as Id<"stories"> })
      advanceStory()
    } catch (err) {
      log.error("Failed to delete story", err)
    }
  }

  // Loading / empty state
  if (!allStories) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-white border-t-transparent" />
      </div>
    )
  }

  if (storyGroups.length === 0) {
    return (
      <div className="fixed inset-0 z-50 flex flex-col items-center justify-center gap-4 bg-black text-primary-foreground">
        <p className="text-lg">No stories right now</p>
        <Link
          href="/feed"
          className="rounded-full bg-card/20 px-6 py-2 text-sm font-medium hover:bg-card/30 transition-colors"
        >
          Back to feed
        </Link>
      </div>
    )
  }

  if (!currentGroup || !currentStory) return null

  const isOwnStory = (currentStory.authorId as string) === (currentUser?._id as string)

  return (
    <div
      className="fixed inset-0 z-50 flex flex-col bg-black select-none"
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      {/* Progress bars */}
      <div className="absolute top-0 left-0 right-0 z-10 flex gap-1 p-2 pt-safe-top">
        {currentGroup.stories.map((_, i) => (
          <div
            key={i}
            className="h-0.5 flex-1 rounded-full overflow-hidden bg-card/30"
          >
            <div
              className="h-full bg-card rounded-full transition-none"
              style={{
                width:
                  i < storyIndex
                    ? "100%"
                    : i === storyIndex
                    ? `${progress}%`
                    : "0%",
              }}
            />
          </div>
        ))}
      </div>

      {/* Story content */}
      <div
        className="absolute inset-0 flex items-center justify-center"
        style={{ backgroundColor: currentStory.backgroundColor ?? "#111" }}
      >
        {currentStory.mediaUrl ? (
          <Image
            src={currentStory.mediaUrl}
            alt={`Story by ${currentGroup.author?.name ?? "user"}`}
            fill
            className="object-contain"
            priority
          />
        ) : (
          <div className="flex items-center justify-center p-10 text-center">
            <p
              className="text-primary-foreground font-semibold text-2xl leading-snug"
              style={{ textShadow: "0 2px 8px rgba(0,0,0,0.4)" }}
            >
              {currentStory.content}
            </p>
          </div>
        )}
      </div>

      {/* Header overlay */}
      <div className="absolute top-8 left-0 right-0 z-10 flex items-center justify-between px-4 mt-2">
        {/* Author info */}
        <Link
          href={`/profile/${currentGroup.authorId}`}
          className="flex items-center gap-2"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="relative h-9 w-9 rounded-full overflow-hidden ring-2 ring-card/50">
            {currentGroup.author?.profilePicture ? (
              <Image
                src={currentGroup.author.profilePicture}
                alt={currentGroup.author.name}
                fill
                sizes="36px"
                className="object-cover"
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center bg-primary text-primary-foreground text-sm font-bold">
                {currentGroup.author?.name.charAt(0).toUpperCase()}
              </div>
            )}
          </div>
          <div>
            <p className="text-primary-foreground text-sm font-semibold leading-tight drop-shadow">
              {currentGroup.author?.name}
            </p>
            <p className="text-primary-foreground/70 text-xs">
              {formatTimeAgo(currentStory.createdAt)}
            </p>
          </div>
        </Link>

        {/* Right actions */}
        <div className="flex items-center gap-2">
          {/* View count (own stories) */}
          {isOwnStory && (
            <div className="flex items-center gap-1 text-primary-foreground/80 text-xs">
              <Eye className="h-4 w-4" />
              <span>{currentStory.viewCount}</span>
            </div>
          )}
          {/* Delete (own stories) */}
          {isOwnStory && (
            <button
              onClick={handleDelete}
              className="rounded-full bg-card/10 p-2 text-primary-foreground hover:bg-card/20 transition-colors"
              aria-label="Delete story"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          )}
          {/* Close */}
          <button
            onClick={() => router.push("/feed")}
            className="rounded-full bg-card/10 p-2 text-primary-foreground hover:bg-card/20 transition-colors"
            aria-label="Close stories"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
      </div>

      {/* Tap zones (left/right) */}
      <div className="absolute inset-0 z-0 flex">
        <button
          className="w-1/3 h-full opacity-0"
          onClick={rewindStory}
          aria-label="Previous story"
        />
        <button
          className="w-2/3 h-full opacity-0"
          onClick={advanceStory}
          aria-label="Next story"
        />
      </div>

      {/* Prev/next group arrows (desktop) */}
      {groupIndex > 0 && (
        <button
          onClick={goToPrevGroup}
          className="absolute left-4 top-1/2 -translate-y-1/2 z-20 hidden md:flex rounded-full bg-card/10 p-3 text-primary-foreground hover:bg-card/20 transition-colors"
          aria-label="Previous user's stories"
        >
          <ChevronLeft className="h-6 w-6" />
        </button>
      )}
      {groupIndex < storyGroups.length - 1 && (
        <button
          onClick={goToNextGroup}
          className="absolute right-4 top-1/2 -translate-y-1/2 z-20 hidden md:flex rounded-full bg-card/10 p-3 text-primary-foreground hover:bg-card/20 transition-colors"
          aria-label="Next user's stories"
        >
          <ChevronRight className="h-6 w-6" />
        </button>
      )}
    </div>
  )
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

interface StoryWithAuthor {
  _id: string
  authorId: string
  content?: string
  mediaUrl?: string
  backgroundColor?: string
  viewCount: number
  createdAt: number
  expiresAt: number
  viewed: boolean
  author?: {
    _id: string
    name: string
    profilePicture?: string
    username?: string
  } | null
}

interface StoryGroup {
  authorId: string
  author: StoryWithAuthor["author"]
  stories: StoryWithAuthor[]
}

function groupStoriesByAuthor(stories: StoryWithAuthor[]): StoryGroup[] {
  const map = new Map<string, StoryGroup>()

  for (const story of stories) {
    const key = story.authorId as string
    if (!map.has(key)) {
      map.set(key, {
        authorId: key,
        author: story.author,
        stories: [],
      })
    }
    map.get(key)!.stories.push(story)
  }

  return Array.from(map.values())
}

function formatTimeAgo(timestamp: number): string {
  const seconds = Math.floor((Date.now() - timestamp) / 1000)
  if (seconds < 60) return "just now"
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`
  return `${Math.floor(seconds / 86400)}d ago`
}
