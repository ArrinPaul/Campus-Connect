"use client"

import { PostComposer } from "@/components/posts/PostComposer"
import { FeedContainer } from "@/components/feed/FeedContainer"

export default function FeedPage() {
  return (
    <div className="mx-auto max-w-2xl space-y-6 px-4 py-8">
      {/* Post Composer */}
      <div className="rounded-lg bg-white p-6 shadow">
        <h2 className="mb-4 text-lg font-semibold text-gray-900">Create a Post</h2>
        <PostComposer />
      </div>

      {/* Feed Container with real-time updates */}
      <FeedContainer />
    </div>
  )
}
