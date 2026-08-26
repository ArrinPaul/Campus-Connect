"use client";

import React, { useState } from "react";
import Link from "next/link";
import { api, useQuery, useMutation } from "@/lib/api";
import { Users, UserPlus, Check, Loader2 } from "lucide-react";
import { OptimizedImage } from "@/components/ui/OptimizedImage";

interface SuggestedUser {
  id: string;
  name: string;
  username?: string;
  profile_picture?: string;
  role?: string;
  university?: string;
}

interface SuggestedUsersProps {
  limit?: number;
  showSeeAll?: boolean;
  className?: string;
}

export function SuggestedUsers({ limit = 5, showSeeAll = false, className = "" }: SuggestedUsersProps) {
  const users = useQuery<SuggestedUser[]>(api.follows.getSuggestedUsers, { limit });
  const followUser = useMutation(api.follows.followUser);

  const [followingMap, setFollowingMap] = useState<Record<string, boolean>>({});
  const [loadingMap, setLoadingMap] = useState<Record<string, boolean>>({});

  const handleFollow = async (e: React.MouseEvent, targetUserId: string) => {
    e.preventDefault();
    e.stopPropagation();

    if (loadingMap[targetUserId] || followingMap[targetUserId]) return;

    setLoadingMap((prev) => ({ ...prev, [targetUserId]: true }));
    try {
      await followUser({ followingId: targetUserId });
      setFollowingMap((prev) => ({ ...prev, [targetUserId]: true }));
    } catch (err) {
      console.error("Failed to follow user:", err);
    } finally {
      setLoadingMap((prev) => ({ ...prev, [targetUserId]: false }));
    }
  };

  return (
    <div className={`rounded-xl border border-hairline bg-canvas p-4 shadow-sm ${className}`} data-testid="suggested-users-widget">
      <div className="flex items-center justify-between pb-3 border-b border-hairline mb-3">
        <div className="flex items-center gap-2">
          <Users className="h-5 w-5 text-primary" />
          <h3 className="font-semibold text-ink text-sm">Suggested Connections</h3>
        </div>
        {showSeeAll && (
          <Link href="/find-partners" className="text-xs font-medium text-primary hover:underline">
            See all
          </Link>
        )}
      </div>

      {users === undefined ? (
        // Loading Skeletons
        <div className="space-y-3" data-testid="suggested-loading">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="animate-pulse flex items-center justify-between py-1">
              <div className="flex items-center gap-2.5">
                <div className="h-9 w-9 rounded-full bg-surface-soft"></div>
                <div className="space-y-1">
                  <div className="h-3.5 bg-surface-soft rounded w-20"></div>
                  <div className="h-2.5 bg-surface-soft rounded w-14"></div>
                </div>
              </div>
              <div className="h-7 w-16 bg-surface-soft rounded-lg"></div>
            </div>
          ))}
        </div>
      ) : users.length === 0 ? (
        // Empty State
        <div className="py-4 text-center text-xs text-charcoal" data-testid="suggested-empty">
          No suggested connections right now. Explore active communities to find peers!
        </div>
      ) : (
        // User List
        <div className="space-y-2.5" data-testid="suggested-list">
          {users.map((user) => {
            const isFollowed = followingMap[user.id];
            const isLoading = loadingMap[user.id];

            return (
              <div
                key={user.id}
                className="flex items-center justify-between py-1 hover:bg-surface-soft/50 rounded-lg px-1.5 transition-colors"
                data-testid={`suggested-user-${user.id}`}
              >
                <Link href={`/profile/${user.id}`} className="flex items-center gap-2.5 min-w-0 flex-1 group">
                  <div className="relative h-8 w-8 flex-shrink-0">
                    {user.profile_picture ? (
                      <OptimizedImage
                        src={user.profile_picture}
                        alt={user.name}
                        fill
                        isAvatar
                        className="rounded-full object-cover"
                      />
                    ) : (
                      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-primary font-bold text-xs">
                        {user.name.charAt(0).toUpperCase()}
                      </div>
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-semibold text-ink truncate group-hover:text-primary transition-colors">
                      {user.name}
                    </p>
                    <p className="text-[11px] text-charcoal truncate">
                      {user.role || (user.username ? `@${user.username}` : "Student")}
                    </p>
                  </div>
                </Link>

                <button
                  type="button"
                  onClick={(e) => handleFollow(e, user.id)}
                  disabled={isLoading || isFollowed}
                  className={`ml-2 flex items-center justify-center gap-1 rounded-lg px-2.5 py-1 text-xs font-medium transition-all ${
                    isFollowed
                      ? "bg-surface-soft text-charcoal border border-hairline cursor-default"
                      : "bg-primary text-white hover:bg-primary-hover active:scale-95"
                  }`}
                  data-testid={`follow-btn-${user.id}`}
                  aria-label={isFollowed ? `Following ${user.name}` : `Follow ${user.name}`}
                >
                  {isLoading ? (
                    <Loader2 className="h-3 w-3 animate-spin" />
                  ) : isFollowed ? (
                    <>
                      <Check className="h-3 w-3 text-success" />
                      <span>Following</span>
                    </>
                  ) : (
                    <>
                      <UserPlus className="h-3 w-3" />
                      <span>Follow</span>
                    </>
                  )}
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
