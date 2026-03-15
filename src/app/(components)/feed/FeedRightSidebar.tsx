'use client';

import { useQuery, useMutation } from '@/lib/api';
import { useUser } from '@clerk/nextjs';
import { OptimizedImage } from '@/components/ui/OptimizedImage';
import { api } from '@/lib/api';
import Link from 'next/link';
import { UserPlus } from 'lucide-react';
import { useGraphFollowMutation, useGraphSuggestions } from '@/hooks/useGraphSuggestions';

export function FeedRightSidebar() {
  const { isSignedIn } = useUser();
  const isAuthenticated = isSignedIn ?? false;
  const trendingHashtags = useQuery(api.hashtags.getTrending, { limit: 6 });
  const { data: suggestions, isLoading: suggestionsLoading } = useGraphSuggestions(3, isAuthenticated);

  return (
    <div className="sticky top-8 space-y-6">
      {/* Trending Topics */}
      <div className="rounded-lg border bg-card p-4">
        <h3 className="font-bold text-lg mb-4">Trending Topics</h3>
        {trendingHashtags === undefined ? (
          <div className="space-y-2">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-5 w-3/4 bg-muted rounded animate-pulse" />
            ))}
          </div>
        ) : trendingHashtags.length === 0 ? (
          <p className="text-sm text-muted-foreground">No trending topics yet.</p>
        ) : (
          <div className="space-y-2">
            {trendingHashtags.map((ht) => (
              <Link
                key={ht._id}
                href={`/hashtag/${ht.tag}`}
                className="flex items-center justify-between group"
              >
                <span className="text-sm font-medium text-primary group-hover:underline">
                  #{ht.tag}
                </span>
                <span className="text-xs text-muted-foreground">{ht.postCount} post{ht.postCount !== 1 ? 's' : ''}</span>
              </Link>
            ))}
          </div>
        )}
      </div>

      {/* Who to Follow */}
      <div className="rounded-lg border bg-card p-4">
        <h3 className="font-bold text-lg mb-4">Who to Follow</h3>
        {suggestionsLoading || suggestions === undefined ? (
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-full bg-muted animate-pulse" />
                <div className="flex-1 space-y-1">
                  <div className="h-4 w-24 bg-muted rounded animate-pulse" />
                  <div className="h-3 w-32 bg-muted rounded animate-pulse" />
                </div>
              </div>
            ))}
          </div>
        ) : suggestions.length === 0 ? (
          <p className="text-sm text-muted-foreground">No suggestions yet.</p>
        ) : (
          <div className="space-y-4">
            {suggestions.map((s) => {
              if (!s.user) return null;
              const displayName = s.user.name ?? s.user.username ?? 'User';
              const profileHref = s.user.convexUserId ? `/profile/${s.user.convexUserId}` : '/profile/me';
              return (
                <div key={s._id} className="flex items-center gap-3">
                  <Link href={profileHref} className="flex-shrink-0">
                    {s.user.profilePicture ? (
                      <OptimizedImage
                        src={s.user.profilePicture}
                        alt={displayName}
                        width={40}
                        height={40}
                        isAvatar
                        className="h-10 w-10 rounded-full object-cover"
                      />
                    ) : (
                      <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                        <span className="text-sm font-bold text-primary">
                          {displayName[0].toUpperCase()}
                        </span>
                      </div>
                    )}
                  </Link>
                  <div className="flex-1 min-w-0">
                    <Link href={profileHref} className="font-semibold text-sm hover:underline truncate block">
                      {displayName}
                    </Link>
                    {s.reasons?.[0] && (
                      <p className="text-xs text-muted-foreground truncate">{s.reasons[0]}</p>
                    )}
                  </div>
                  <FollowButton convexUserId={s.user.convexUserId ?? undefined} targetClerkId={s.user.clerkId} />
                </div>
              );
            })}
          </div>
        )}
        <Link href="/find-partners" className="mt-4 block text-xs text-primary hover:underline text-center">
          Find more people
        </Link>
      </div>
    </div>
  );
}

function FollowButton({ convexUserId, targetClerkId }: { convexUserId?: string; targetClerkId: string }) {
  const { isSignedIn } = useUser();
  const isAuthenticated = isSignedIn ?? false;
  const hasConvexUserId = !!convexUserId;
  const followUser = useMutation(api.follows.followUser);
  const unfollowUser = useMutation(api.follows.unfollowUser);
  const graphFollowMutation = useGraphFollowMutation(3);
  const isFollowing = useQuery(
    api.follows.isFollowing,
    isAuthenticated && hasConvexUserId ? { userId: convexUserId as any } : 'skip'
  );

  if (hasConvexUserId && isFollowing === undefined) {
    return <div className="h-7 w-16 bg-muted rounded-full animate-pulse" />;
  }

  const following = hasConvexUserId ? !!isFollowing : false;

  return (
    <button
      onClick={() =>
        hasConvexUserId
          ? following
            ? unfollowUser({ userId: convexUserId as any })
            : followUser({ userId: convexUserId as any })
          : graphFollowMutation.mutate({ targetClerkId, action: 'follow' })
      }
      className={`flex items-center gap-1 rounded-full px-3 py-1 text-xs font-semibold transition-colors ${
        following
          ? 'border border-border text-muted-foreground hover:border-destructive hover:text-destructive'
          : 'bg-primary text-primary-foreground hover:bg-primary/90'
      }`}
    >
      {!following && <UserPlus className="h-3 w-3" />}
      {following ? 'Following' : 'Follow'}
    </button>
  );
}
