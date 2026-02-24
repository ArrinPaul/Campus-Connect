'use client';

import { Suspense, useState } from 'react';
import { useQuery, useMutation } from 'convex/react';
import { api } from '@/convex/_generated/api';
import type { Id } from '@/convex/_generated/dataModel';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { ArrowLeft, Users, Shield, ShieldCheck, Crown, Clock, MoreVertical, UserMinus, ArrowUpCircle, ArrowDownCircle, Check, X, UserPlus, Mail, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { InviteMemberModal } from '@/components/communities/InviteMemberModal';

type PageProps = {
    params: {
        slug: string;
    };
};

type Member = {
    _id: Id<'communityMembers'>;
    userId: Id<'users'>;
    name: string;
    username?: string;
    role: 'owner' | 'admin' | 'moderator' | 'member' | 'pending';
    joinedAt: number;
    profilePicture?: string;
};

const roleIcons: Record<string, React.ReactNode> = {
    owner: <Crown className="h-3.5 w-3.5 text-yellow-500" />,
    admin: <ShieldCheck className="h-3.5 w-3.5 text-blue-500" />,
    moderator: <Shield className="h-3.5 w-3.5 text-green-500" />,
    pending: <Clock className="h-3.5 w-3.5 text-orange-500" />,
};

const roleLabels: Record<string, string> = {
    owner: 'Owner',
    admin: 'Admin',
    moderator: 'Moderator',
    member: 'Member',
    pending: 'Pending',
};

function MemberActionMenu({ member, communityId, viewerRole }: { member: Member; communityId: Id<'communities'>; viewerRole: string }) {
    const [open, setOpen] = useState(false);
    const removeMember = useMutation(api.communities.removeMember);
    const updateMemberRole = useMutation(api.communities.updateMemberRole);
    const approveJoinRequest = useMutation(api.communities.approveJoinRequest);

    // Only admins and owners can moderate
    if (viewerRole !== 'owner' && viewerRole !== 'admin') return null;
    // Can't moderate yourself or the owner
    if (member.role === 'owner') return null;
    // Admins can't moderate other admins
    if (viewerRole === 'admin' && member.role === 'admin') return null;

    const handleRemove = async () => {
        try {
            await removeMember({ communityId, userId: member.userId });
            toast.success(`${member.name} has been removed`);
            setOpen(false);
        } catch (err) {
            toast.error(err instanceof Error ? err.message : 'Failed to remove member');
        }
    };

    const handleRoleChange = async (newRole: 'admin' | 'moderator' | 'member') => {
        try {
            await updateMemberRole({ communityId, userId: member.userId, role: newRole });
            toast.success(`${member.name} is now ${roleLabels[newRole]}`);
            setOpen(false);
        } catch (err) {
            toast.error(err instanceof Error ? err.message : 'Failed to update role');
        }
    };

    const handleApprove = async () => {
        try {
            await approveJoinRequest({ communityId, userId: member.userId });
            toast.success(`${member.name} has been approved`);
            setOpen(false);
        } catch (err) {
            toast.error(err instanceof Error ? err.message : 'Failed to approve request');
        }
    };

    const handleReject = async () => {
        try {
            await removeMember({ communityId, userId: member.userId });
            toast.success(`Request from ${member.name} has been rejected`);
            setOpen(false);
        } catch (err) {
            toast.error(err instanceof Error ? err.message : 'Failed to reject request');
        }
    };

    if (member.role === 'pending') {
        return (
            <div className="flex items-center gap-1">
                <button
                    onClick={handleApprove}
                    className="p-1.5 rounded-lg bg-green-500/10 text-green-600 hover:bg-green-500/20 transition-colors"
                    title="Approve"
                >
                    <Check className="h-4 w-4" />
                </button>
                <button
                    onClick={handleReject}
                    className="p-1.5 rounded-lg bg-red-500/10 text-red-600 hover:bg-red-500/20 transition-colors"
                    title="Reject"
                >
                    <X className="h-4 w-4" />
                </button>
            </div>
        );
    }

    return (
        <div className="relative">
            <button
                onClick={() => setOpen(!open)}
                className="p-1.5 rounded-lg hover:bg-muted transition-colors"
            >
                <MoreVertical className="h-4 w-4" />
            </button>
            {open && (
                <>
                    <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
                    <div className="absolute right-0 top-8 z-50 w-48 rounded-lg border bg-card shadow-lg py-1">
                        {viewerRole === 'owner' && member.role !== 'admin' && (
                            <button
                                onClick={() => handleRoleChange('admin')}
                                className="w-full flex items-center gap-2 px-3 py-2 text-sm hover:bg-muted"
                            >
                                <ArrowUpCircle className="h-4 w-4 text-blue-500" />
                                Promote to Admin
                            </button>
                        )}
                        {viewerRole === 'owner' && member.role !== 'moderator' && (
                            <button
                                onClick={() => handleRoleChange('moderator')}
                                className="w-full flex items-center gap-2 px-3 py-2 text-sm hover:bg-muted"
                            >
                                <Shield className="h-4 w-4 text-green-500" />
                                {member.role === 'admin' ? 'Demote to Moderator' : 'Make Moderator'}
                            </button>
                        )}
                        {viewerRole === 'owner' && member.role !== 'member' && (
                            <button
                                onClick={() => handleRoleChange('member')}
                                className="w-full flex items-center gap-2 px-3 py-2 text-sm hover:bg-muted"
                            >
                                <ArrowDownCircle className="h-4 w-4 text-muted-foreground" />
                                Demote to Member
                            </button>
                        )}
                        <button
                            onClick={handleRemove}
                            className="w-full flex items-center gap-2 px-3 py-2 text-sm text-red-600 hover:bg-red-500/10"
                        >
                            <UserMinus className="h-4 w-4" />
                            Remove Member
                        </button>
                    </div>
                </>
            )}
        </div>
    );
}

function MemberRow({ member, communityId, viewerRole }: { member: Member; communityId: Id<'communities'>; viewerRole: string }) {
    return (
        <div className="flex items-center gap-3 p-3 rounded-lg border bg-card hover:bg-muted/30 transition-colors">
            <Link href={`/profile/${member.userId}`} className="flex-shrink-0">
                {member.profilePicture ? (
                    <Image src={member.profilePicture} alt={member.name} width={40} height={40} className="h-10 w-10 rounded-full object-cover" />
                ) : (
                    <div className="h-10 w-10 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold">
                        {member.name.charAt(0).toUpperCase()}
                    </div>
                )}
            </Link>
            <div className="flex-1 min-w-0">
                <Link href={`/profile/${member.userId}`} className="font-medium text-sm hover:underline">
                    {member.name}
                </Link>
                <div className="flex items-center gap-1.5 mt-0.5">
                    {roleIcons[member.role]}
                    <span className="text-xs text-muted-foreground">{roleLabels[member.role]}</span>
                </div>
            </div>
            <MemberActionMenu member={member} communityId={communityId} viewerRole={viewerRole} />
        </div>
    );
}

const CommunityMembersPageSkeleton = () => (
    <div className="max-w-4xl mx-auto py-8 px-4">
        <div className="h-10 w-48 bg-muted/50 rounded-md animate-pulse mb-6" />
        <div className="space-y-4">
            {[...Array(5)].map((_, i) => (
                <div key={i} className="p-4 border rounded-lg bg-card h-16 animate-pulse" />
            ))}
        </div>
    </div>
);

function CommunityMembersPageContent({ slug }: { slug: string }) {
    const [showPending, setShowPending] = useState(false);
    const [showInviteModal, setShowInviteModal] = useState(false);
    const [showInvites, setShowInvites] = useState(false);
    const community = useQuery(api.communities.getCommunity, { slug });
    const viewerRole = (community as any)?.viewerRole || null;
    const isAdmin = viewerRole === 'owner' || viewerRole === 'admin';

    const members = useQuery(api.communities.getCommunityMembers, community ? { communityId: community._id, includePending: isAdmin } : 'skip');
    const pendingInvites = useQuery(api.communities.getCommunityInvites, community && isAdmin ? { communityId: community._id } : 'skip');
    const revokeInvite = useMutation(api.communities.revokeInvite);

    if (community === undefined || members === undefined) {
        return <CommunityMembersPageSkeleton />;
    }

    if (community === null) {
        notFound();
    }

    const activeMembers = (members || []).filter((m: any) => m?.role !== 'pending') as Member[];
    const pendingMembers = (members || []).filter((m: any) => m?.role === 'pending') as Member[];

    return (
        <div className="max-w-4xl mx-auto py-8 px-4">
            <Link href={`/c/${slug}`} className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-4">
                <ArrowLeft className="h-4 w-4" />
                Back to {community.name}
            </Link>

            <div className="flex items-center justify-between mb-6">
                <h1 className="text-3xl font-bold">Members of {community.name}</h1>
                <div className="flex items-center gap-3">
                    {isAdmin && (
                        <button
                            onClick={() => setShowInviteModal(true)}
                            className="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors"
                        >
                            <UserPlus className="h-4 w-4" />
                            Invite
                        </button>
                    )}
                    <span className="text-sm text-muted-foreground">{activeMembers.length} members</span>
                </div>
            </div>

            {/* Pending Invites Section (admin/owner only) */}
            {isAdmin && pendingInvites && pendingInvites.length > 0 && (
                <div className="mb-6">
                    <button
                        onClick={() => setShowInvites(!showInvites)}
                        className="flex items-center gap-2 text-sm font-semibold text-blue-600 mb-3"
                    >
                        <Mail className="h-4 w-4" />
                        Pending Invites ({pendingInvites.length})
                    </button>
                    {showInvites && (
                        <div className="space-y-2 mb-4 p-4 rounded-lg border border-blue-200 dark:border-blue-900/50 bg-blue-50/50 dark:bg-blue-900/10">
                            {pendingInvites.map((invite: any) => (
                                <div key={invite._id} className="flex items-center gap-3 p-2.5 rounded-lg bg-background/70 border">
                                    {invite.invitedUser?.profilePicture ? (
                                        <Image src={invite.invitedUser.profilePicture} alt={invite.invitedUser?.name || ''} width={36} height={36} className="h-9 w-9 rounded-full object-cover" />
                                    ) : (
                                        <div className="h-9 w-9 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-bold">
                                            {invite.invitedUser?.name?.charAt(0)?.toUpperCase() || '?'}
                                        </div>
                                    )}
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm font-medium">{invite.invitedUser?.name || 'Unknown'}</p>
                                        <p className="text-xs text-muted-foreground">
                                            Invited by {invite.inviter?.name || 'someone'} · {new Date(invite.createdAt).toLocaleDateString()}
                                        </p>
                                    </div>
                                    <button
                                        onClick={async () => {
                                            try {
                                                await revokeInvite({ inviteId: invite._id });
                                                toast.success('Invite revoked');
                                            } catch (err: any) {
                                                toast.error(err.message || 'Failed to revoke');
                                            }
                                        }}
                                        className="px-2.5 py-1 text-xs font-medium rounded-md border text-red-600 hover:bg-red-500/10 transition-colors"
                                    >
                                        Revoke
                                    </button>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}

            {/* Pending Members Section (admin/owner only) */}
            {isAdmin && pendingMembers.length > 0 && (
                <div className="mb-6">
                    <button
                        onClick={() => setShowPending(!showPending)}
                        className="flex items-center gap-2 text-sm font-semibold text-orange-600 mb-3"
                    >
                        <Clock className="h-4 w-4" />
                        Pending Requests ({pendingMembers.length})
                    </button>
                    {showPending && (
                        <div className="space-y-2 mb-4 p-4 rounded-lg border border-orange-200 dark:border-orange-900/50 bg-orange-50/50 dark:bg-orange-900/10">
                            {pendingMembers.map((member) => (
                                <MemberRow key={member._id} member={member} communityId={community._id} viewerRole={viewerRole} />
                            ))}
                        </div>
                    )}
                </div>
            )}

            {/* Active Members */}
            <div className="space-y-2">
                {activeMembers.length === 0 ? (
                    <div className="text-center py-16 text-muted-foreground">
                        <Users className="h-16 w-16 mx-auto mb-4" />
                        <h3 className="text-lg font-semibold">No members yet</h3>
                        <p className="text-sm mt-2">Be the first to join this community!</p>
                    </div>
                ) : (
                    activeMembers.map((member) => (
                        <MemberRow key={member._id} member={member} communityId={community._id} viewerRole={viewerRole} />
                    ))
                )}
            </div>

            {/* Invite Modal */}
            {showInviteModal && (
                <InviteMemberModal
                    communityId={community._id}
                    communityName={community.name}
                    onClose={() => setShowInviteModal(false)}
                />
            )}
        </div>
    );
}

export default function CommunityMembersPage({ params }: PageProps) {
    return (
        <Suspense fallback={<CommunityMembersPageSkeleton />}>
            <CommunityMembersPageContent slug={params.slug} />
        </Suspense>
    );
}
