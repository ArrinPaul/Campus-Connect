"use client"

import { useState } from "react"
import { useUser } from "@clerk/nextjs"
import { useQuery, useMutation } from "convex/react"
import { api } from "@/convex/_generated/api"
import { CommunityInfoSidebar } from "@/components/communities/CommunityInfoSidebar"
import { Users, Globe, Lock, EyeOff, FileText, Info, Settings } from "lucide-react"
import Link from "next/link"

type Tab = "posts" | "about" | "members"

interface CommunityPageProps {
  params: { slug: string }
}

export default function CommunityPage({ params }: CommunityPageProps) {
  const { isLoaded, isSignedIn } = useUser()
  const [activeTab, setActiveTab] = useState<Tab>("posts")
  const [isLoading, setIsLoading] = useState(false)
  const [actionError, setActionError] = useState<string | null>(null)

  const community = useQuery(
    api.communities.getCommunity,
    isLoaded ? { slug: params.slug } : "skip"
  )

  const posts = useQuery(
    api.communities.getCommunityPosts,
    community ? { communityId: community._id } : "skip"
  )

  const members = useQuery(
    api.communities.getCommunityMembers,
    community && activeTab === "members"
      ? { communityId: community._id }
      : "skip"
  )

  const joinCommunity = useMutation(api.communities.joinCommunity)
  const leaveCommunity = useMutation(api.communities.leaveCommunity)

  if (!isLoaded) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-gray-300 border-t-blue-600" />
      </div>
    )
  }

  if (community === undefined) {
    return (
      <div className="mx-auto max-w-5xl px-4 py-8">
        <div className="animate-pulse space-y-4">
          <div className="h-48 w-full rounded-xl bg-gray-200 dark:bg-gray-700" />
          <div className="h-8 w-1/3 rounded bg-gray-200 dark:bg-gray-700" />
          <div className="h-4 w-2/3 rounded bg-gray-200 dark:bg-gray-700" />
        </div>
      </div>
    )
  }

  if (community === null) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
            Community Not Found
          </h1>
          <p className="mt-2 text-gray-500">
            This community doesn&apos;t exist or has been removed.
          </p>
          <Link
            href="/communities"
            className="mt-4 inline-block rounded-lg bg-blue-600 px-4 py-2 text-sm text-white hover:bg-blue-700"
          >
            Browse Communities
          </Link>
        </div>
      </div>
    )
  }

  const isMember = community.viewerRole && community.viewerRole !== "pending"
  const isPending = community.viewerRole === "pending"
  const isAdmin =
    community.viewerRole === "owner" || community.viewerRole === "admin"

  const TypeIcon =
    community.type === "public"
      ? Globe
      : community.type === "private"
        ? Lock
        : EyeOff

  const handleJoin = async () => {
    setIsLoading(true)
    setActionError(null)
    try {
      await joinCommunity({ communityId: community._id })
    } catch (err) {
      setActionError(err instanceof Error ? err.message : "Failed")
    } finally {
      setIsLoading(false)
    }
  }

  const handleLeave = async () => {
    setIsLoading(true)
    setActionError(null)
    try {
      await leaveCommunity({ communityId: community._id })
    } catch (err) {
      setActionError(err instanceof Error ? err.message : "Failed")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="mx-auto max-w-5xl px-4 py-4 sm:px-6 sm:py-8">
      {/* Banner */}
      <div
        className="relative h-32 w-full overflow-hidden rounded-xl bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 sm:h-48"
        style={
          community.banner
            ? {
                backgroundImage: `url(${community.banner})`,
                backgroundSize: "cover",
                backgroundPosition: "center",
              }
            : undefined
        }
      />

      {/* Community Header */}
      <div className="-mt-8 ml-4 flex items-end gap-4 sm:-mt-12 sm:ml-6">
        <div className="relative">
          <div className="flex h-16 w-16 items-center justify-center rounded-xl border-4 border-white bg-gradient-to-br from-blue-400 to-purple-500 text-2xl font-bold text-white dark:border-gray-900 sm:h-24 sm:w-24 sm:text-4xl">
            {community.avatar ? (
              <img
                src={community.avatar}
                alt={community.name}
                className="h-full w-full rounded-xl object-cover"
              />
            ) : (
              community.name.charAt(0).toUpperCase()
            )}
          </div>
        </div>
        <div className="pb-1 flex-1 min-w-0">
          {/* Mobile: name below avatar, pushed by flex */}
        </div>
      </div>

      {/* Info Row */}
      <div className="mt-2 px-4 sm:px-0">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
              {community.name}
            </h1>
            <div className="mt-1 flex flex-wrap items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
              <span className="inline-flex items-center gap-1">
                <TypeIcon className="h-3.5 w-3.5" />
                {community.type.charAt(0).toUpperCase() + community.type.slice(1)}
              </span>
              <span>·</span>
              <span className="inline-flex items-center gap-1">
                <Users className="h-3.5 w-3.5" />
                {community.memberCount.toLocaleString()} member
                {community.memberCount !== 1 ? "s" : ""}
              </span>
              <span>·</span>
              <span>{community.category}</span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {actionError && (
              <p className="text-xs text-red-500">{actionError}</p>
            )}
            {isAdmin && (
              <Link
                href={`/c/${params.slug}/settings`}
                className="inline-flex items-center gap-1 rounded-lg border border-gray-300 px-3 py-1.5 text-sm font-medium text-gray-600 hover:bg-gray-100 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700 transition-colors"
              >
                <Settings className="h-3.5 w-3.5" />
                Settings
              </Link>
            )}
            {!isMember && !isPending && isSignedIn && (
              <button
                onClick={handleJoin}
                disabled={isLoading}
                className="rounded-lg bg-blue-600 px-4 py-1.5 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50 transition-colors"
              >
                {isLoading
                  ? "..."
                  : community.type === "private"
                    ? "Request to Join"
                    : "Join"}
              </button>
            )}
            {isPending && (
              <span className="rounded-lg bg-yellow-100 px-4 py-1.5 text-sm font-medium text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300">
                Request Pending
              </span>
            )}
            {isMember && (
              <button
                onClick={handleLeave}
                disabled={isLoading}
                className="rounded-lg border border-gray-300 px-4 py-1.5 text-sm font-medium text-gray-600 hover:border-red-400 hover:text-red-600 disabled:opacity-50 dark:border-gray-600 dark:text-gray-300 transition-colors"
              >
                {isLoading ? "..." : "Leave"}
              </button>
            )}
          </div>
        </div>

        <p className="mt-3 text-gray-600 dark:text-gray-400">
          {community.description}
        </p>
      </div>

      {/* Tabs */}
      <div className="mt-4 border-b border-gray-200 dark:border-gray-700">
        <nav className="flex gap-6">
          {(["posts", "about", "members"] as Tab[]).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`flex items-center gap-2 border-b-2 pb-3 text-sm font-medium capitalize transition-colors ${
                activeTab === tab
                  ? "border-blue-600 text-blue-600 dark:border-blue-400 dark:text-blue-400"
                  : "border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
              }`}
            >
              {tab === "posts" && <FileText className="h-4 w-4" />}
              {tab === "about" && <Info className="h-4 w-4" />}
              {tab === "members" && <Users className="h-4 w-4" />}
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
            </button>
          ))}
        </nav>
      </div>

      {/* Tab Content */}
      <div className="mt-6">
        {/* Posts Tab */}
        {activeTab === "posts" && (
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
            <div className="lg:col-span-2">
              {posts === undefined ? (
                <div className="space-y-4">
                  {[1, 2, 3].map((i) => (
                    <div
                      key={i}
                      className="h-32 w-full animate-pulse rounded-xl bg-gray-200 dark:bg-gray-700"
                    />
                  ))}
                </div>
              ) : posts.length === 0 ? (
                <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-gray-300 bg-gray-50 py-16 dark:border-gray-600 dark:bg-gray-800/50">
                  <FileText className="mb-3 h-10 w-10 text-gray-400" />
                  <p className="text-lg font-medium text-gray-900 dark:text-gray-100">
                    No posts yet
                  </p>
                  <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                    {isMember
                      ? "Be the first to post in this community"
                      : "Join to start posting"}
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {posts.map((post) => (
                    <div
                      key={post._id}
                      className="rounded-xl border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-800"
                    >
                      <div className="flex items-center gap-2 mb-2">
                        <span className="font-medium text-gray-900 dark:text-gray-100">
                          {post.author?.name ?? "Unknown"}
                        </span>
                        <span className="text-xs text-gray-400">
                          {new Date(post.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                      <p className="text-gray-700 dark:text-gray-300">
                        {post.content}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Sidebar */}
            <div>
              <CommunityInfoSidebar
                communityId={community._id}
                slug={params.slug}
                rules={community.rules}
                moderators={[]}
                createdAt={community.createdAt}
              />
            </div>
          </div>
        )}

        {/* About Tab */}
        {activeTab === "about" && (
          <div className="max-w-2xl">
            <CommunityInfoSidebar
              communityId={community._id}
              slug={params.slug}
              rules={community.rules}
              moderators={[]}
              createdAt={community.createdAt}
            />
          </div>
        )}

        {/* Members Tab */}
        {activeTab === "members" && (
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                Members ({community.memberCount})
              </h2>
              <Link
                href={`/c/${params.slug}/members`}
                className="text-sm text-blue-600 hover:underline dark:text-blue-400"
              >
                View all →
              </Link>
            </div>

            {members === undefined ? (
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {[1, 2, 3, 4, 5, 6].map((i) => (
                  <div
                    key={i}
                    className="h-16 animate-pulse rounded-lg bg-gray-200 dark:bg-gray-700"
                  />
                ))}
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {members.slice(0, 9).map((member) => (
                  <Link
                    key={member?._id}
                    href={`/profile/${member?.username ?? member?.userId}`}
                    className="flex items-center gap-3 rounded-lg border border-gray-200 bg-white p-3 hover:border-blue-300 dark:border-gray-700 dark:bg-gray-800 transition-colors"
                  >
                    <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-blue-400 to-purple-500 text-sm font-bold text-white">
                      {member?.name?.charAt(0) ?? "?"}
                    </div>
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium text-gray-900 dark:text-gray-100">
                        {member?.name}
                      </p>
                      <p className="text-xs capitalize text-gray-500 dark:text-gray-400">
                        {member?.role}
                      </p>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
