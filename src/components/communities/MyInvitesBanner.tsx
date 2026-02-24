'use client';

import { useQuery, useMutation } from 'convex/react';
import { api } from '@/convex/_generated/api';
import type { Id } from '@/convex/_generated/dataModel';
import { useState } from 'react';
import { Mail, Check, X, Loader2, Users } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { toast } from 'sonner';

export function MyInvitesBanner() {
    const invites = useQuery(api.communities.getMyInvites);
    const acceptInvite = useMutation(api.communities.acceptInvite);
    const declineInvite = useMutation(api.communities.declineInvite);
    const [processing, setProcessing] = useState<string | null>(null);

    if (!invites || invites.length === 0) return null;

    const handleAccept = async (inviteId: Id<'communityInvites'>) => {
        setProcessing(inviteId);
        try {
            await acceptInvite({ inviteId });
            toast.success('Invite accepted! You are now a member.');
        } catch (err: any) {
            toast.error(err.message || 'Failed to accept invite');
        } finally {
            setProcessing(null);
        }
    };

    const handleDecline = async (inviteId: Id<'communityInvites'>) => {
        setProcessing(inviteId);
        try {
            await declineInvite({ inviteId });
            toast.success('Invite declined.');
        } catch (err: any) {
            toast.error(err.message || 'Failed to decline invite');
        } finally {
            setProcessing(null);
        }
    };

    return (
        <div className="rounded-lg border border-blue-200 dark:border-blue-900/50 bg-blue-50/50 dark:bg-blue-900/10 p-4">
            <div className="flex items-center gap-2 mb-3">
                <Mail className="h-4 w-4 text-blue-600" />
                <h3 className="text-sm font-semibold text-blue-700 dark:text-blue-400">
                    Community Invites ({invites.length})
                </h3>
            </div>
            <div className="space-y-3">
                {invites.map((invite: any) => (
                    <div key={invite._id} className="flex items-center gap-3 rounded-lg bg-background/70 p-3 border">
                        {invite.community?.avatarUrl ? (
                            <Image
                                src={invite.community.avatarUrl}
                                alt={invite.community?.name || 'Community'}
                                width={40}
                                height={40}
                                className="h-10 w-10 rounded-full object-cover flex-shrink-0"
                            />
                        ) : (
                            <div className="h-10 w-10 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold flex-shrink-0">
                                <Users className="h-5 w-5" />
                            </div>
                        )}
                        <div className="flex-1 min-w-0">
                            <Link
                                href={`/c/${invite.community?.slug || ''}`}
                                className="text-sm font-medium hover:underline"
                            >
                                {invite.community?.name || 'Unknown Community'}
                            </Link>
                            <p className="text-xs text-muted-foreground">
                                Invited by {invite.inviter?.name || 'someone'}
                            </p>
                        </div>
                        <div className="flex items-center gap-1.5">
                            <button
                                onClick={() => handleAccept(invite._id)}
                                disabled={processing === invite._id}
                                className="flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium rounded-md bg-green-600 text-white hover:bg-green-700 disabled:opacity-50 transition-colors"
                            >
                                {processing === invite._id ? (
                                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                ) : (
                                    <Check className="h-3.5 w-3.5" />
                                )}
                                Accept
                            </button>
                            <button
                                onClick={() => handleDecline(invite._id)}
                                disabled={processing === invite._id}
                                className="flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium rounded-md border hover:bg-muted disabled:opacity-50 transition-colors"
                            >
                                <X className="h-3.5 w-3.5" />
                                Decline
                            </button>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
