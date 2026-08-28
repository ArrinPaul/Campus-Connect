'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useQuery, useMutation, api } from '@/lib/api';
import { useUser } from '@/lib/auth/client';
import { Search, UserSearch, Handshake, Users, BookOpen, Sparkles, MessageSquare, UserPlus, UserCheck, ArrowRight, X, MapPin, Briefcase } from 'lucide-react';
import { OptimizedImage } from '@/components/ui/OptimizedImage';
import { AvatarWithStatus } from '@/components/ui/OnlineStatusDot';
import { toast } from 'sonner';

type CategoryFilter = 'all' | 'project' | 'study' | 'research' | 'skill';

const CATEGORIES: { id: CategoryFilter; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
  { id: 'all', label: 'All Partners', icon: Users },
  { id: 'project', label: 'Project Teammates', icon: Handshake },
  { id: 'study', label: 'Study Groups', icon: BookOpen },
  { id: 'research', label: 'Research Peers', icon: UserSearch },
  { id: 'skill', label: 'Skill Exchange', icon: Sparkles },
];

export default function FindPartnersPage() {
  const router = useRouter();
  const { isSignedIn } = useUser();
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState<CategoryFilter>('all');
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
      toast.error('Please sign in to follow partners.');
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
      toast.success(isNowFollowing ? 'Followed user' : 'Unfollowed user');
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
      toast.error('Please sign in to message partners.');
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
      {/* Hero Header Section */}
      <div className="bg-card border-b border-border p-6 rounded-lg shadow-elevation-1 space-y-4">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-lg bg-primary/10 text-primary flex items-center justify-center shrink-0">
            <Handshake className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-2xl font-bold font-display text-foreground tracking-tight">
              Find Campus Partners
            </h1>
            <p className="text-xs text-muted-foreground mt-0.5">
              Connect with study buddies, project teammates, and research peers.
            </p>
          </div>
        </div>

        {/* Search Bar */}
        <div className="relative w-full">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by name, skill (e.g. React, Python), or major..."
            className="w-full pl-11 pr-10 h-11 bg-canvas border border-border rounded-lg text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary transition-colors shadow-sm"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Category Pills Bar */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar">
          {CATEGORIES.map((cat) => {
            const Icon = cat.icon;
            const isActive = activeCategory === cat.id;
            return (
              <button
                key={cat.id}
                onClick={() => setActiveCategory(cat.id)}
                className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all ${
                  isActive
                    ? 'bg-primary text-white shadow-glow-sm'
                    : 'bg-canvas border border-border text-muted-foreground hover:border-primary/50 hover:text-foreground'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{cat.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Main List Grid - Single Column or Clean Dual Grid */}
      <div className="space-y-4">
        {searchResults === undefined ? (
          <div className="space-y-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="animate-pulse rounded-lg bg-card p-5 border border-border space-y-3">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full bg-canvas shrink-0" />
                  <div className="space-y-2 flex-1">
                    <div className="h-4 w-32 bg-canvas rounded" />
                    <div className="h-3 w-20 bg-canvas rounded" />
                  </div>
                </div>
                <div className="h-3 w-full bg-canvas rounded" />
                <div className="h-9 w-full bg-canvas rounded-lg" />
              </div>
            ))}
          </div>
        ) : users.length === 0 ? (
          <div className="text-center py-12 bg-card border border-border rounded-lg p-6">
            <Users className="w-10 h-10 text-muted-foreground mx-auto mb-2" />
            <h3 className="text-sm font-semibold text-foreground">No partners found</h3>
            <p className="text-xs text-muted-foreground mt-1">
              Try typing a skill like &ldquo;Python&rdquo;, &ldquo;Design&rdquo;, or &ldquo;Biology&rdquo; in the search box.
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
                  className="group rounded-lg border border-border bg-card p-5 hover:border-primary/40 hover:shadow-elevation-1 transition-all duration-200"
                >
                  {/* Top User Info Section */}
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
                            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary font-bold text-base border border-border">
                              {user.name?.charAt(0).toUpperCase() || 'U'}
                            </div>
                          )}
                        </div>
                      </AvatarWithStatus>
                      
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h3 className="text-sm font-bold text-foreground truncate group-hover:underline">
                            {user.name}
                          </h3>
                          <span className="text-[10px] rounded-full bg-primary/10 px-2 py-0.5 font-semibold text-primary">
                            {user.role || 'Student'}
                          </span>
                        </div>
                        
                        {user.university && (
                          <p className="text-xs text-muted-foreground mt-0.5 flex items-center gap-1 truncate">
                            <MapPin className="w-3 h-3 text-muted-foreground/70 shrink-0" />
                            <span className="truncate">{user.university}</span>
                          </p>
                        )}
                      </div>
                    </Link>

                    {/* Quick Follow Button */}
                    <button
                      onClick={(e) => handleFollowToggle(targetUserId, e)}
                      disabled={isLoading}
                      className={`px-3 py-1.5 rounded-lg border text-xs font-semibold transition-all shrink-0 flex items-center gap-1.5 ${
                        isFollowing
                          ? 'bg-canvas border-border text-muted-foreground hover:text-critical'
                          : 'bg-primary text-white hover:bg-primary/90 shadow-glow-sm'
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

                  {/* Skills Pills Row */}
                  {user.skills && user.skills.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 mt-4 pt-3 border-t border-border/60">
                      {user.skills.slice(0, 5).map((skill: string) => (
                        <span
                          key={skill}
                          onClick={() => setSearchQuery(skill)}
                          className="text-[11px] px-2.5 py-1 rounded-lg bg-canvas border border-border text-foreground hover:border-primary cursor-pointer transition-colors"
                        >
                          {skill}
                        </span>
                      ))}
                      {user.skills.length > 5 && (
                        <span className="text-[11px] text-muted-foreground font-medium self-center pl-1">
                          +{user.skills.length - 5} more
                        </span>
                      )}
                    </div>
                  )}

                  {/* Bottom Action Footer */}
                  <div className="mt-4 flex items-center gap-2">
                    <Link
                      href={`/profile/${targetUserId}`}
                      className="flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg border border-border bg-canvas text-xs font-semibold text-foreground hover:border-primary/50 transition-colors"
                    >
                      <span>View Full Profile</span>
                      <ArrowRight className="w-3.5 h-3.5 text-muted-foreground" />
                    </Link>

                    <button
                      onClick={(e) => handleMessage(targetUserId, e)}
                      className="py-2 px-4 rounded-lg bg-card border border-border text-xs font-semibold text-primary hover:bg-primary/10 hover:border-primary/30 transition-colors flex items-center gap-1.5"
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
