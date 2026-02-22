"use client"

import { useState } from "react"
import { useUser } from "@clerk/nextjs"
import { useQuery, useMutation } from "convex/react"
import { api } from "@/convex/_generated/api"
import { Id } from "@/convex/_generated/dataModel"
import { Users, Search, ShieldCheck, Crown, Shield, ChevronLeft } from "lucide-react"
import Link from "next/link"

interface MembersPageProps {
  params: { slug: string }
}

const ROLE_ICONS: Record<string, React.ElementType> = {
  owner: Crown,
  admin: ShieldCheck,
  moderator: Shield,
  member: Users,
}

const ROLE_COLORS: Record<string, string> = {
  owner: "text-accent-amber",
  admin: "text-primary",
  moderator: "text-accent-emerald",
  member: "text-muted-foreground",
}

export default function CommunityMembersPage({ params }: MembersPageProps) {
  const { isLoaded, isSignedIn } = useUser()
  const [search, setSearch] = useState("")

  const community = useQuery(
    api.communities.getCommunity,
    isLoaded ? { slug: params.slug } : "skip"
  )

  const members = useQuery(
    api.communities.getCommunityMembers,
    community
      ? {
          communityId: community._id,
          includePending:
            community.viewerRole === "owner" ||
            community.viewerRole === "admin",
        }
      : "skip"
  )

  const removeMember = useMutation(api.communities.removeMember)
  const updateMemberRole = useMutation(api.communities.updateMemberRole)

  const isViewer = (userId: string) => {
    // We only use display; mutations checked server-side
    return (
      community?.viewerRole === "owner" || community?.viewerRole === "admin"
    )
  }

  const handleRemove = async (userId: Id<"users">) => {
    if (!community) return
    if (!confirm("Remove this member?")) return
    try {
      await removeMember({ communityId: community._id, userId })
    } catch (e) {
      alert(e instanceof Error ? e.message : "Failed to remove member")
    }
  }

  const handleUpdateRole = async (
    userId: Id<"users">,
    role: "admin" | "moderator" | "member"
  ) => {
    if (!community) return
    try {
      await updateMemberRole({ communityId: community._id, userId, role })
    } catch (e) {
      alert(e instanceof Error ? e.message : "Failed to update role")
    }
  }

  const filteredMembers = members?.filter((m) => {
    if (!search) return true
    const lower = search.toLowerCase()
    return (
      m?.name?.toLowerCase().includes(lower) ||
      m?.username?.toLowerCase().includes(lower)
    )
  })

  return (
    <div className="mx-auto max-w-3xl px-4 py-4 sm:px-6 sm:py-8">
      {/* Back Link */}
      <Link
        href={`/c/${params.slug}`}
        className="inline-flex items-center gap-1 mb-4 text-sm text-muted-foreground hover:text-foreground"
      >
        <ChevronLeft className="h-4 w-4" />
        Back to {community?.name ?? "community"}
      </Link>

      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
          <Users className="h-6 w-6 text-primary" />
          Members
          {community && (
            <span className="text-lg font-normal text-muted-foreground">
              ({community.memberCount})
            </span>
          )}
        </h1>
      </div>

      {/* Search */}
      <div className="relative mb-6">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search members..."
          className="w-full rounded-xl border border-border bg-background py-2.5 pl-10 pr-4 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary/40 focus:outline-none focus:ring-1 focus:ring-primary/30"
        />
      </div>

      {/* Members List */}
      {members === undefined ? (
        <div className="space-y-3">
          {[1, 2, 3, 4, 5].map((i) => (
            <div
              key={i}
              className="h-16 animate-shimmer rounded-xl bg-muted"
            />
          ))}
        </div>
      ) : (
        <div className="space-y-2">
          {filteredMembers?.map((member) => {
            if (!member) return null
            const RoleIcon = ROLE_ICONS[member.role] ?? Users
            const isAdmin =
              community?.viewerRole === "owner" ||
              community?.viewerRole === "admin"
            const isMemberOwner = member.role === "owner"

            return (
              <div
                key={member._id}
                className="flex items-center justify-between rounded-xl border border-border/50 bg-card p-3"
              >
                <Link
                  href={`/profile/${member.username ?? member.userId}`}
                  className="flex items-center gap-3 min-w-0"
                >
                  <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-primary/10 text-sm font-bold text-primary">
                    {member.name?.charAt(0) ?? "?"}
                  </div>
                  <div className="min-w-0">
                    <p className="truncate font-medium text-foreground">
                      {member.name}
                    </p>
                    <p className={`flex items-center gap-1 text-xs capitalize ${ROLE_COLORS[member.role]}`}>
                      <RoleIcon className="h-3 w-3" />
                      {member.role}
                    </p>
                  </div>
                </Link>

                {/* Admin controls */}
                {isAdmin && !isMemberOwner && (
                  <div className="flex items-center gap-2 ml-2">
                    <select
                      value={member.role}
                      onChange={(e) =>
                        handleUpdateRole(
                          member.userId as Id<"users">,
                          e.target.value as "admin" | "moderator" | "member"
                        )
                      }
                      className="rounded border border-border bg-background px-2 py-1 text-xs text-foreground focus:outline-none"
                    >
                      <option value="admin">Admin</option>
                      <option value="moderator">Moderator</option>
                      <option value="member">Member</option>
                    </select>
                    <button
                      onClick={() => handleRemove(member.userId as Id<"users">)}
                      className="rounded border border-destructive/30 px-2 py-1 text-xs text-destructive hover:bg-destructive/10 transition-colors"
                    >
                      Remove
                    </button>
                  </div>
                )}
              </div>
            )
          })}

          {filteredMembers?.length === 0 && (
            <p className="py-8 text-center text-muted-foreground">
              No members found
            </p>
          )}
        </div>
      )}
    </div>
  )
}
