"use client"

import { useState } from "react"
import { useQuery } from "convex/react"
import { useConvexAuth } from "convex/react"
import { api } from "@/convex/_generated/api"
import { useRouter } from "next/navigation"
import { StoryRingRow, type StoryRingUser, type StoryRingStory } from "./StoryRing"
import { StoryComposer } from "./StoryComposer"

/**
 * Fetches stories and renders the horizontal story ring row.
 * Placed at the top of the feed.
 */
export function StoryRow() {
  const router = useRouter()
  const { isAuthenticated } = useConvexAuth()
  const allStories = useQuery(api.stories.getStories, isAuthenticated ? {} : 'skip')
  const currentUser = useQuery(api.users.getCurrentUser, isAuthenticated ? {} : 'skip')
  const [composerOpen, setComposerOpen] = useState(false)

  if (!allStories || allStories.length === 0 || !currentUser) {
    // Show empty own-story button even when no stories exist
    return (
      <>
        <div className="overflow-x-auto py-1">
          <StoryRingRow
            storyGroups={[]}
            onStoryClick={() => {}}
            onAddStory={() => setComposerOpen(true)}
          />
        </div>
        <StoryComposer
          isOpen={composerOpen}
          onClose={() => setComposerOpen(false)}
          onCreated={() => setComposerOpen(false)}
        />
      </>
    )
  }

  // Group stories by authorId
  const groupMap = new Map<
    string,
    { author: StoryRingUser; stories: StoryRingStory[] }
  >()

  for (const story of allStories) {
    const authorId = story.authorId as string
    if (!groupMap.has(authorId)) {
      groupMap.set(authorId, {
        author: {
          _id: story.author?._id as string ?? authorId,
          name: story.author?.name ?? "Unknown",
          username: story.author?.username,
          profilePicture: story.author?.profilePicture,
        },
        stories: [],
      })
    }
    groupMap.get(authorId)!.stories.push({
      _id: story._id as string,
      viewed: story.viewed,
    })
  }

  const storyGroups = Array.from(groupMap.entries()).map(([authorId, data]) => ({
    author: data.author,
    stories: data.stories,
    isOwn: authorId === (currentUser._id as string),
  }))

  const handleStoryClick = (authorId: string) => {
    router.push(`/stories?userId=${authorId}`)
  }

  return (
    <>
      <div className="overflow-x-auto">
        <StoryRingRow
          storyGroups={storyGroups}
          onStoryClick={handleStoryClick}
          onAddStory={() => setComposerOpen(true)}
        />
      </div>
      <StoryComposer
        isOpen={composerOpen}
        onClose={() => setComposerOpen(false)}
        onCreated={() => setComposerOpen(false)}
      />
    </>
  )
}
