"use client"

import Image from "next/image"
import { Plus } from "lucide-react"
import { cn } from "@/lib/utils"

export interface StoryRingUser {
  _id: string
  name: string
  username?: string
  profilePicture?: string
}

export interface StoryRingStory {
  _id: string
  viewed: boolean
}

interface StoryRingProps {
  user: StoryRingUser
  stories: StoryRingStory[]
  /** Show "+" overlay for own stories (add to story) */
  isOwn?: boolean
  /** If true, show the composer variant (no ring, just + button) */
  composerMode?: boolean
  onClick?: () => void
  className?: string
}

/**
 * Circular avatar with a gradient ring indicator for stories.
 * - Gradient ring = unseen stories present
 * - Gray ring = all stories seen
 * - No ring = no active stories (own profile shows + to add)
 */
export function StoryRing({
  user,
  stories,
  isOwn = false,
  composerMode = false,
  onClick,
  className,
}: StoryRingProps) {
  const hasStories = stories.length > 0
  const hasUnseen = stories.some((s) => !s.viewed)

  const ringClass = cn(
    "relative flex flex-col items-center gap-1 cursor-pointer select-none",
    className
  )

  const avatarContainerClass = cn(
    "relative flex items-center justify-center rounded-full",
    hasStories && hasUnseen
      ? "story-ring"
      : hasStories
      ? "story-ring-seen"
      : ""
  )

  const displayName =
    user.username ? `@${user.username}` : user.name.split(" ")[0]

  return (
    <button
      type="button"
      onClick={onClick}
      className={ringClass}
      aria-label={
        isOwn
          ? composerMode
            ? "Add to story"
            : `Your stories`
          : `${user.name}'s stories`
      }
    >
      <div className={avatarContainerClass} style={{ width: 68, height: 68 }}>
        {/* Gap between ring and avatar */}
        <div className="rounded-full bg-card p-[3px]">
          <div className="relative h-[54px] w-[54px] rounded-full overflow-hidden bg-muted">
            {user.profilePicture ? (
              <Image
                src={user.profilePicture}
                alt={user.name}
                fill
                sizes="56px"
                className="object-cover"
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-primary to-accent-violet text-primary-foreground text-lg font-bold">
                {user.name.charAt(0).toUpperCase()}
              </div>
            )}
          </div>
        </div>

        {/* "+" overlay for own ring (create story) */}
        {isOwn && (
          <div className="absolute bottom-0 right-0 flex h-5 w-5 items-center justify-center rounded-full bg-primary ring-2 ring-card">
            <Plus className="h-3 w-3 text-primary-foreground" strokeWidth={3} />
          </div>
        )}
      </div>

      {/* Label */}
      <span className="max-w-[72px] truncate text-[11px] text-foreground text-center">
        {isOwn ? "Your Story" : displayName}
      </span>
    </button>
  )
}

// ─── StoryRingRow ──────────────────────────────────────────────────────────────

interface StoryGroup {
  author: StoryRingUser
  stories: StoryRingStory[]
  isOwn: boolean
}

interface StoryRingRowProps {
  storyGroups: StoryGroup[]
  onStoryClick: (authorId: string) => void
  onAddStory: () => void
  className?: string
}

/**
 * Horizontal scrolling row of story rings, shown at the top of the feed.
 * The current user's ring always comes first.
 */
export function StoryRingRow({
  storyGroups,
  onStoryClick,
  onAddStory,
  className,
}: StoryRingRowProps) {
  const ownGroup = storyGroups.find((g) => g.isOwn)
  const otherGroups = storyGroups.filter((g) => !g.isOwn)

  return (
    <div
      className={cn(
        "flex items-start gap-3 overflow-x-auto py-3 px-1 scrollbar-none",
        className
      )}
    >
      {/* Own story ring (always first) */}
      {ownGroup ? (
        <StoryRing
          user={ownGroup.author}
          stories={ownGroup.stories}
          isOwn
          onClick={() => onStoryClick(ownGroup.author._id)}
        />
      ) : (
        /* No own stories yet — show add button only */
        <AddStoryButton onClick={onAddStory} />
      )}

      {otherGroups.map((group) => (
        <StoryRing
          key={group.author._id}
          user={group.author}
          stories={group.stories}
          onClick={() => onStoryClick(group.author._id)}
        />
      ))}
    </div>
  )
}

// ─── AddStoryButton ───────────────────────────────────────────────────────────

function AddStoryButton({ onClick }: { onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex flex-col items-center gap-1 cursor-pointer select-none"
      aria-label="Add to story"
    >
      <div
        className="relative flex items-center justify-center rounded-full border-2 border-dashed border-border bg-muted"
        style={{ width: 68, height: 68 }}
      >
        <Plus className="h-6 w-6 text-primary" />
      </div>
      <span className="max-w-[72px] truncate text-[11px] text-foreground text-center">
        Add Story
      </span>
    </button>
  )
}
