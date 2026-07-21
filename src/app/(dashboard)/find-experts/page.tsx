'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useQuery, useMutation, api } from '@/lib/api';
import { useUser } from '@/lib/auth/client';
import { Search, UserSearch, Award, MessageSquare, UserPlus, UserCheck, ArrowRight, ShieldCheck, X, MapPin } from 'lucide-react';
import { OptimizedImage } from '@/components/ui/OptimizedImage';
import { AvatarWithStatus } from '@/components/ui/OnlineStatusDot';
import { toast } from 'sonner';

export default function FindExpertsPage() {
  const router = useRouter();
  const { isSignedIn } = useUser();
  const [searchQuery, setSearchQuery] = useState('');
  const [followingMap, setFollowingMap] = useState<Record<string, boolean>>({});
  const [loadingMap, setLoadingMap] = useState<Record<string, boolean>>({});

  const getOrCreateConversation = useMutation(api.conversations.getOrCreateConversation);
  const followUser = useMutation(api.follows.followUser);
  const unfollowUser = useMutation(api.follows.unfollowUser);

  const searchResults = useQuery(
    api.users.searchUsers,
    { query: searchQuery, limit: 30 }
  );

  const users = Array.isArray(searchResults) ? searchResults : [];

  const handleFollowToggle = async (userId: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!isSignedIn) {
      toast.error('Please sign in to follow experts.');
      return;
    }
    const isFollowing = followingMap[userId] ?? false;
    setLoadingMap(prev => ({ ...prev, [userId]: true }));
    try {
      if (isFollowing) {
        await unfollowUser({ userId: userId as any });
      } else {
        await followUser({ userId: userId as any });
      }
      const isNowFollowing = !isFollowing;
      setFollowingMap(prev => ({ ...prev, [userId]: isNowFollowing }));
      toast.success(isNowFollowing ? 'Followed expert' : 'Unfollowed expert');
    } catch (err) {
      toast.error('Failed to update follow status');
    } finally {
      setLoadingMap(prev => ({ ...prev, [userId]: false }));
    }
  };

  const handleMessage = async (userId: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!isSignedIn) {
      toast.error('Please sign in to message experts.');
      return;
    }
    try {
      const res = await getOrCreateConversation({ participantId: userId as any, otherUserId: userId as any });
      const conversationId = typeof res === 'string' ? res : (res?._id || res?.id);
      if (conversationId) {
        router.push(`/messages?c=${conversationId}`);
      }
    } catch (err) {
      toast.error('Failed to start conversation');
    }
  };

  return (
    <div className="w-full bg-canvas min-h-screen pb-16 space-y-6">
      {/* Header Banner */}
      <div className="bg-surface-soft border-b border-hairline p-6 rounded-2xl shadow-elevation-1 space-y-4">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-accent-violet/10 text-accent-violet flex items-center justify-center shrink-0">
            <UserSearch className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-2xl font-bold font-display text-ink-deep tracking-tight">
              Find Academic Experts
            </h1>
            <p className="text-xs text-slate mt-0.5">
              Connect with faculty, scholars, and subject matter experts.
            </p>
          </div>
        </div>

        {/* Search Bar */}
        <div className="relative w-full">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search experts by domain, subject, department, or skill..."
            className="w-full pl-11 pr-10 h-11 bg-canvas border border-hairline rounded-xl text-xs text-ink-deep placeholder:text-slate focus:outline-none focus:border-accent-violet transition-colors shadow-sm"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate hover:text-ink-deep"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Experts List */}
      <div className="space-y-4">
        {searchResults === undefined ? (
          <div className="space-y-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="animate-pulse rounded-2xl bg-surface-soft p-5 border border-hairline space-y-3">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full bg-canvas shrink-0" />
                  <div className="space-y-2 flex-1">
                    <div className="h-4 w-32 bg-canvas rounded" />
                    <div className="h-3 w-20 bg-canvas rounded" />
                  </div>
                </div>
                <div className="h-3 w-full bg-canvas rounded" />
                <div className="h-9 w-full bg-canvas rounded-xl" />
              </div>
            ))}
          </div>
        ) : users.length === 0 ? (
          <div className="text-center py-12 bg-surface-soft border border-hairline rounded-2xl p-6">
            <Award className="w-10 h-10 text-slate mx-auto mb-2" />
            <h3 className="text-sm font-semibold text-ink-deep">No experts found</h3>
            <p className="text-xs text-slate mt-1">
              Try searching by a specific academic field or domain topic.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {users.map((user: any) => {
              const targetUserId = user._id || user.id || user.userId;
              if (!targetUserId) return null;

              const isFollowing = followingMap[targetUserId] ?? user.isFollowing ?? false;
              const isLoading = loadingMap[targetUserId] ?? false;

              return (
                <div
                  key={targetUserId}
                  className="group rounded-2xl border border-hairline bg-surface-soft p-5 hover:border-accent-violet/40 hover:shadow-elevation-1 transition-all duration-200"
                >
                  <div className="flex items-start justify-between gap-3">
                    <Link href={`/profile/${targetUserId}`} className="flex items-center gap-3 min-w-0 flex-1">
                      <AvatarWithStatus userId={targetUserId} size="md">
                        <div className="relative h-12 w-12 flex-shrink-0">
                          {user.profilePicture ? (
                            <OptimizedImage
                              src={user.profilePicture}
                              alt={user.name}
                              fill
                              isAvatar
                              sizes="48px"
                              className="rounded-full object-cover group-hover:opacity-90 transition-opacity"
                            />
                          ) : (
                            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-accent-violet/10 text-accent-violet font-bold text-base border border-hairline">
                              {user.name?.charAt(0).toUpperCase() || 'E'}
                            </div>
                          )}
                        </div>
                      </AvatarWithStatus>
                      
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <h3 className="text-sm font-bold text-ink-deep truncate group-hover:underline">
                            {user.name}
                          </h3>
                          <ShieldCheck className="w-4 h-4 text-primary shrink-0" />
                        </div>
                        <span className="text-[10px] rounded-full bg-accent-violet/10 px-2 py-0.5 font-semibold text-accent-violet inline-block mt-0.5">
                          {user.role || 'Faculty'}
                        </span>
                        
                        {user.university && (
                          <p className="text-xs text-slate mt-0.5 flex items-center gap-1 truncate">
                            <MapPin className="w-3 h-3 text-slate/70 shrink-0" />
                            <span className="truncate">{user.university}</span>
                          </p>
                        )}
                      </div>
                    </Link>

                    <button
                      onClick={(e) => handleFollowToggle(targetUserId, e)}
                      disabled={isLoading}
                      className={`px-3 py-1.5 rounded-xl border text-xs font-semibold transition-all shrink-0 flex items-center gap-1.5 ${
                        isFollowing
                          ? 'bg-canvas border-hairline text-slate hover:text-critical'
                          : 'bg-accent-violet text-white hover:bg-accent-violet/90 shadow-glow-sm'
                      }`}
                    >
                      {isFollowing ? (
                        <>
                          <UserCheck className="w-3.5 h-3.5" />
                          <span>Following</span>
                        </>
                      ) : (
                        <>
                          <UserPlus className="w-3.5 h-3.5" />
                          <span>Follow</span>
                        </>
                      )}
                    </button>
                  </div>

                  {user.skills && user.skills.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 mt-4 pt-3 border-t border-hairline/60">
                      {user.skills.slice(0, 5).map((skill: string) => (
                        <span
                          key={skill}
                          onClick={() => setSearchQuery(skill)}
                          className="text-[11px] px-2.5 py-1 rounded-lg bg-canvas border border-hairline text-ink-deep hover:border-accent-violet cursor-pointer transition-colors"
                        >
                          {skill}
                        </span>
                      ))}
                    </div>
                  )}

                  <div className="mt-4 flex items-center gap-2">
                    <Link
                      href={`/profile/${targetUserId}`}
                      className="flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl border border-hairline bg-canvas text-xs font-semibold text-ink-deep hover:border-accent-violet/50 transition-colors"
                    >
                      <span>View Full Profile</span>
                      <ArrowRight className="w-3.5 h-3.5 text-slate" />
                    </Link>

                    <button
                      onClick={(e) => handleMessage(targetUserId, e)}
                      className="py-2 px-4 rounded-xl bg-surface-soft border border-hairline text-xs font-semibold text-accent-violet hover:bg-accent-violet/10 hover:border-accent-violet/30 transition-colors flex items-center gap-1.5"
                    >
                      <MessageSquare className="w-3.5 h-3.5" />
                      <span>Message</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
