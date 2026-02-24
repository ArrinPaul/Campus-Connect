'use client';

import { useState, useCallback, useEffect, useRef } from 'react';
import { useQuery, useMutation } from 'convex/react';
import { api } from '@/convex/_generated/api';
import type { Id } from '@/convex/_generated/dataModel';
import { X, Search, UserPlus, Loader2, Check, Mail } from 'lucide-react';
import Image from 'next/image';
import { toast } from 'sonner';

interface InviteMemberModalProps {
    communityId: Id<'communities'>;
    communityName: string;
    onClose: () => void;
}

export function InviteMemberModal({ communityId, communityName, onClose }: InviteMemberModalProps) {
    const [searchQuery, setSearchQuery] = useState('');
    const [debouncedQuery, setDebouncedQuery] = useState('');
    const [sending, setSending] = useState<string | null>(null);
    const [sentIds, setSentIds] = useState<Set<string>>(new Set());
    const inputRef = useRef<HTMLInputElement>(null);

    const inviteUser = useMutation(api.communities.inviteUser);

    // Debounce search
    useEffect(() => {
        const timer = setTimeout(() => setDebouncedQuery(searchQuery.trim()), 300);
        return () => clearTimeout(timer);
    }, [searchQuery]);

    const searchResults = useQuery(
        api.search.searchUsersEnhanced,
        debouncedQuery.length >= 2 ? { query: debouncedQuery } : 'skip'
    );

    // Existing invites for this community
    const existingInvites = useQuery(api.communities.getCommunityInvites, { communityId });

    // Focus input on mount
    useEffect(() => {
        inputRef.current?.focus();
    }, []);

    const handleInvite = useCallback(async (userId: Id<'users'>) => {
        setSending(userId);
        try {
            await inviteUser({ communityId, userId });
            setSentIds((prev) => new Set(prev).add(userId));
            toast.success('Invite sent successfully!');
        } catch (err: any) {
            toast.error(err.message || 'Failed to send invite');
        } finally {
            setSending(null);
        }
    }, [communityId, inviteUser]);

    const alreadyInvitedIds = new Set(
        (existingInvites || []).map((inv: any) => inv.invitedUserId as string)
    );

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={onClose}>
            <div
                className="bg-background rounded-xl shadow-xl w-full max-w-md mx-4 max-h-[80vh] flex flex-col"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header */}
                <div className="flex items-center justify-between px-5 py-4 border-b">
                    <div>
                        <h2 className="text-lg font-semibold">Invite Members</h2>
                        <p className="text-xs text-muted-foreground">Invite users to join {communityName}</p>
                    </div>
                    <button onClick={onClose} className="p-1 rounded-md hover:bg-muted">
                        <X className="h-5 w-5" />
                    </button>
                </div>

                {/* Search Input */}
                <div className="px-5 py-3 border-b">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <input
                            ref={inputRef}
                            type="text"
                            placeholder="Search users by name..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full pl-9 pr-4 py-2.5 rounded-lg border bg-muted/30 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
                        />
                    </div>
                </div>

                {/* Results */}
                <div className="flex-1 overflow-y-auto px-5 py-3 min-h-[200px]">
                    {debouncedQuery.length < 2 ? (
                        <div className="flex flex-col items-center justify-center h-full text-muted-foreground text-sm py-8">
                            <Mail className="h-10 w-10 mb-3 opacity-40" />
                            <p>Type at least 2 characters to search for users</p>
                        </div>
                    ) : searchResults === undefined ? (
                        <div className="flex items-center justify-center py-8">
                            <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                        </div>
                    ) : searchResults.length === 0 ? (
                        <p className="text-center text-muted-foreground text-sm py-8">No users found</p>
                    ) : (
                        <div className="space-y-1">
                            {searchResults.map((user: any) => {
                                const isAlreadyInvited = alreadyInvitedIds.has(user._id) || sentIds.has(user._id);
                                const isSending = sending === user._id;

                                return (
                                    <div key={user._id} className="flex items-center gap-3 p-2.5 rounded-lg hover:bg-muted/50 transition-colors">
                                        {user.profilePicture ? (
                                            <Image
                                                src={user.profilePicture}
                                                alt={user.name}
                                                width={36}
                                                height={36}
                                                className="h-9 w-9 rounded-full object-cover flex-shrink-0"
                                            />
                                        ) : (
                                            <div className="h-9 w-9 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-bold flex-shrink-0">
                                                {user.name?.charAt(0).toUpperCase()}
                                            </div>
                                        )}
                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm font-medium truncate">{user.name}</p>
                                            {user.username && (
                                                <p className="text-xs text-muted-foreground truncate">@{user.username}</p>
                                            )}
                                        </div>
                                        {isAlreadyInvited ? (
                                            <span className="flex items-center gap-1 text-xs text-green-600 font-medium px-2">
                                                <Check className="h-3.5 w-3.5" />
                                                Invited
                                            </span>
                                        ) : (
                                            <button
                                                onClick={() => handleInvite(user._id)}
                                                disabled={isSending}
                                                className="flex items-center gap-1 px-3 py-1.5 text-xs font-medium rounded-md bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-50 transition-colors"
                                            >
                                                {isSending ? (
                                                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                                ) : (
                                                    <UserPlus className="h-3.5 w-3.5" />
                                                )}
                                                Invite
                                            </button>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>

                {/* Footer with sent count */}
                {sentIds.size > 0 && (
                    <div className="px-5 py-3 border-t text-xs text-muted-foreground text-center">
                        {sentIds.size} invite{sentIds.size !== 1 ? 's' : ''} sent this session
                    </div>
                )}
            </div>
        </div>
    );
}
