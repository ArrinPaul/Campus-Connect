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
 * Circular avatar with Instagram-style story ring:
 * - 4-stop gradient ring = unseen stories
 * - Gray ring = viewed stories
 * - Plus badge = current user story affordance
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

  const displayName = user.username ? user.username : user.name.split(" ")[0]

  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "flex flex-col items-center gap-1.5 cursor-pointer select-none active:scale-95 transition-transform shrink-0",
        className
      )}
      aria-label={
        isOwn
          ? composerMode
            ? "Add to story"
            : "Your stories"
          : `${user.name}'s stories`
      }
    >
      <div className="relative">
        {/* Outer Ring Container */}
        <div
          className={cn(
            "flex h-[68px] w-[68px] items-center justify-center rounded-full p-[2.5px] transition-all",
            hasStories && hasUnseen
              ? "bg-gradient-to-tr from-[#FEDA75] via-[#FA7E1E] via-[#D62976] via-[#962FBF] to-[#4F5BD5]"
              : hasStories
              ? "bg-border dark:bg-zinc-800"
              : isOwn
              ? "bg-transparent"
              : "bg-border/60"
          )}
        >
          {/* Inner 2px Gap Surface */}
          <div className="flex h-full w-full items-center justify-center rounded-full bg-card p-[2px]">
            {/* Avatar Photo */}
            <div className="relative h-full w-full rounded-full overflow-hidden bg-muted">
              {user.profilePicture ? (
                <Image
                  src={user.profilePicture}
                  alt={user.name}
                  fill
                  sizes="64px"
                  className="object-cover"
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center bg-primary/10 text-primary text-sm font-bold">
                  {user.name.charAt(0).toUpperCase()}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* "+" overlay for own story */}
        {isOwn && (
          <div className="absolute bottom-0 right-0 flex h-5 w-5 items-center justify-center rounded-full bg-primary ring-2 ring-card shadow-sm">
            <Plus className="h-3.5 w-3.5 text-on-primary stroke-[3]" />
          </div>
        )}
      </div>

      {/* Label */}
      <span className="max-w-[70px] truncate text-[11px] font-medium text-foreground tracking-tight text-center">
        {isOwn ? "Your story" : displayName}
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
        "flex items-center gap-3.5 overflow-x-auto py-2 px-3 no-scrollbar scroll-smooth",
        className
      )}
    >
      {/* Own story ring */}
      {ownGroup ? (
        <StoryRing
          user={ownGroup.author}
          stories={ownGroup.stories}
          isOwn
          onClick={() => onStoryClick(ownGroup.author._id)}
        />
      ) : (
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
      className="flex flex-col items-center gap-1.5 cursor-pointer select-none active:scale-95 transition-transform shrink-0"
      aria-label="Add to story"
    >
      <div className="relative flex h-[68px] w-[68px] items-center justify-center rounded-full border border-dashed border-border bg-muted/30">
        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary">
          <Plus className="h-5 w-5 stroke-[2.5]" />
        </div>
      </div>
      <span className="max-w-[70px] truncate text-[11px] font-medium text-foreground tracking-tight text-center">
        Your story
      </span>
    </button>
  )
}
