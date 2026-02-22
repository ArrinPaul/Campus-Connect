"use client"

import { useState } from "react"
import { useUser } from "@clerk/nextjs"
import { useQuery, useMutation } from "convex/react"
import { api } from "@/convex/_generated/api"
import { CommunityInfoSidebar } from "@/components/communities/CommunityInfoSidebar"
import { Users, Globe, Lock, EyeOff, FileText, Info, Settings } from "lucide-react"
import Link from "next/link"
import Image from "next/image"

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
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-border border-t-primary" />
      </div>
    )
  }

  if (community === undefined) {
    return (
      <div className="mx-auto max-w-5xl px-4 py-8">
        <div className="animate-pulse space-y-4">
          <div className="h-48 w-full rounded-xl bg-muted animate-shimmer" />
          <div className="h-8 w-1/3 rounded bg-muted animate-shimmer" />
          <div className="h-4 w-2/3 rounded bg-muted animate-shimmer" />
        </div>
      </div>
    )
  }

  if (community === null) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-foreground">
            Community Not Found
          </h1>
          <p className="mt-2 text-muted-foreground">
            This community doesn&apos;t exist or has been removed.
          </p>
          <Link
            href="/communities"
            className="mt-4 inline-block rounded-lg bg-primary px-4 py-2 text-sm text-white hover:bg-primary/90"
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
        className="relative h-32 w-full overflow-hidden rounded-xl bg-primary sm:h-48"
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
          <div className="relative flex h-16 w-16 items-center justify-center rounded-xl border-4 border-card bg-primary text-2xl font-bold text-white sm:h-24 sm:w-24 sm:text-4xl">
            {community.avatar ? (
              <Image
                src={community.avatar}
                alt={community.name}
                fill={true}
                className="rounded-xl object-cover"
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
            <h1 className="text-2xl font-bold text-foreground">
              {community.name}
            </h1>
            <div className="mt-1 flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
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
              <p className="text-xs text-destructive">{actionError}</p>
            )}
            {isAdmin && (
              <Link
                href={`/c/${params.slug}/settings`}
                className="inline-flex items-center gap-1 rounded-lg border border-border px-3 py-1.5 text-sm font-medium text-muted-foreground hover:bg-muted transition-colors"
              >
                <Settings className="h-3.5 w-3.5" />
                Settings
              </Link>
            )}
            {!isMember && !isPending && isSignedIn && (
              <button
                onClick={handleJoin}
                disabled={isLoading}
                className="rounded-lg bg-primary px-4 py-1.5 text-sm font-medium text-white hover:bg-primary/90 disabled:opacity-50 transition-colors"
              >
                {isLoading
                  ? "..."
                  : community.type === "private"
                    ? "Request to Join"
                    : "Join"}
              </button>
            )}
            {isPending && (
              <span className="rounded-lg bg-accent-amber/15 px-4 py-1.5 text-sm font-medium text-accent-amber">
                Request Pending
              </span>
            )}
            {isMember && (
              <button
                onClick={handleLeave}
                disabled={isLoading}
                className="rounded-lg border border-border px-4 py-1.5 text-sm font-medium text-muted-foreground hover:border-red-400 hover:text-destructive disabled:opacity-50 transition-colors"
              >
                {isLoading ? "..." : "Leave"}
              </button>
            )}
          </div>
        </div>

        <p className="mt-3 text-muted-foreground">
          {community.description}
        </p>
      </div>

      {/* Tabs */}
      <div className="mt-4 border-b border-border">
        <nav className="flex gap-6">
          {(["posts", "about", "members"] as Tab[]).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`flex items-center gap-2 border-b-2 pb-3 text-sm font-medium capitalize transition-colors ${
                activeTab === tab
                  ? "border-primary text-primary"
                  : "border-transparent text-muted-foreground hover:border-border hover:text-foreground"
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
                      className="h-32 w-full animate-pulse rounded-xl bg-muted animate-shimmer"
                    />
                  ))}
                </div>
              ) : posts.length === 0 ? (
                <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border bg-muted/50 py-16">
                  <FileText className="mb-3 h-10 w-10 text-muted-foreground" />
                  <p className="text-lg font-medium text-foreground">
                    No posts yet
                  </p>
                  <p className="mt-1 text-sm text-muted-foreground">
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
                      className="rounded-xl border border-border/50 bg-card p-4"
                    >
                      <div className="flex items-center gap-2 mb-2">
                        <span className="font-medium text-foreground">
                          {post.author?.name ?? "Unknown"}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          {new Date(post.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                      <p className="text-foreground">
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
              <h2 className="text-lg font-semibold text-foreground">
                Members ({community.memberCount})
              </h2>
              <Link
                href={`/c/${params.slug}/members`}
                className="text-sm text-primary hover:underline"
              >
                View all →
              </Link>
            </div>

            {members === undefined ? (
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {[1, 2, 3, 4, 5, 6].map((i) => (
                  <div
                    key={i}
                    className="h-16 animate-pulse rounded-lg bg-muted animate-shimmer"
                  />
                ))}
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {members.slice(0, 9).map((member) => (
                  <Link
                    key={member?._id}
                    href={`/profile/${member?.username ?? member?.userId}`}
                    className="flex items-center gap-3 rounded-lg border border-border/50 bg-card p-3 hover:border-primary/30 transition-colors"
                  >
                    <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full bg-primary/10 text-sm font-bold text-primary">
                      {member?.name?.charAt(0) ?? "?"}
                    </div>
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium text-foreground">
                        {member?.name}
                      </p>
                      <p className="text-xs capitalize text-muted-foreground">
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
