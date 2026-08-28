'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import type { Doc } from '@/lib/api';
import { Users, Rss, Settings, Lock, Share2 } from 'lucide-react';
import Link from 'next/link';
import { useMutation } from '@/lib/api';
import { api } from '@/lib/api';
import { useUser } from '@/lib/auth/client';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

// Manually defining type based on getCommunity query
type Community = Doc<'communities'> & {
    viewerRole: string | null;
};

type Props = {
    community: Community;
};

export function CommunityHeader({ community }: Props) {
    const { isSignedIn } = useUser();
    const isAuthenticated = isSignedIn ?? false;
    const joinCommunity = useMutation(api.communities.joinCommunity);
    const leaveCommunity = useMutation(api.communities.leaveCommunity);
    const [isLoading, setIsLoading] = useState(false);

    const isMember = community.viewerRole === 'member' || community.viewerRole === 'admin' || community.viewerRole === 'owner';
    const isOwner = community.viewerRole === 'owner';

    const handleJoinLeave = async () => {
        if (!isAuthenticated || isLoading) return;
        setIsLoading(true);
        try {
            if (isMember) {
                await leaveCommunity({ communityId: community._id });
            } else {
                await joinCommunity({ communityId: community._id });
            }
        } catch (err) {
            console.error('Join/Leave failed:', err);
        } finally {
            setIsLoading(false);
        }
    };

    const typeInfo = {
        public: { icon: Users, text: 'Public' },
        private: { icon: Lock, text: 'Private' },
        secret: { icon: Rss, text: 'Secret' },
    }

    return (
        <div className="w-full bg-card border-b border-border shadow-sm">
            {/* Banner Section */}
            <div className="relative h-48 md:h-80 w-full max-w-[1096px] mx-auto bg-muted overflow-hidden md:rounded-b-lg">
                {community.banner ? (
                    <Image 
                        src={community.banner} 
                        alt="" 
                        fill 
                        priority
                        className="object-cover opacity-90" 
                    />
                ) : (
                    <div className="absolute inset-0 bg-tile-1 opacity-5" />
                )}
            </div>

            {/* Header Content */}
            <div className="max-w-[1024px] mx-auto px-4 md:px-8 pb-0">
                <div className="relative flex flex-col md:flex-row items-center md:items-end -mt-16 md:-mt-8 md:mb-4">
                    {/* Avatar */}
                    <div className="relative h-32 w-32 md:h-40 md:w-40 rounded-lg border-4 border-surface-soft bg-card shadow-sm overflow-hidden flex-shrink-0 z-10 md:mr-6">
                        {community.avatar ? (
                            <Image src={community.avatar} alt={community.name} width={160} height={160} className="h-full w-full object-cover" />
                        ) : (
                            <div className="h-full w-full flex items-center justify-center text-foreground/20 font-display text-6xl">
                                {community.name.charAt(0)}
                            </div>
                        )}
                    </div>

                    {/* Text & Actions */}
                    <div className="mt-4 md:mt-0 w-full flex flex-col md:flex-row justify-between items-center md:items-end gap-4 md:pb-4">
                        <div className="flex-1 text-center md:text-left space-y-2">
                            <h1 className="text-heading-lg font-bold text-foreground leading-tight">
                                {community.name}
                            </h1>
                            <div className="flex flex-wrap items-center justify-center md:justify-start gap-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider mt-2">
                                <div className="flex items-center gap-1.5">
                                    <Users size={16} className="text-primary" />
                                    <span>{community.memberCount} members</span>
                                </div>
                                <div className="flex items-center gap-1.5 border-l border-border pl-4">
                                    {React.createElement(typeInfo[community.type as keyof typeof typeInfo]?.icon || typeInfo.public.icon, { size: 16, className: 'text-primary' })}
                                    <span>{typeInfo[community.type as keyof typeof typeInfo]?.text || typeInfo.public.text}</span>
                                </div>
                            </div>
                            <p className="text-body-md text-muted-foreground max-w-2xl mt-4 leading-relaxed">
                                {community.description}
                            </p>
                        </div>

                        {/* CTAs */}
                        <div className="flex items-center gap-3">
                            <Button variant="pearl" size="icon" className="shadow-sm">
                                <Share2 size={20} />
                            </Button>
                            {!isOwner && (
                                <Button
                                    onClick={handleJoinLeave}
                                    disabled={isLoading || !isAuthenticated}
                                    variant={isMember ? "secondary" : "primary"}
                                    size="lg"
                                    className="min-w-[120px]"
                                >
                                    {isLoading ? '...' : isMember ? 'Leave' : 'Join Community'}
                                </Button>
                            )}
                            {(community.viewerRole === 'admin' || isOwner) && (
                                <Link href={`/c/${community.slug}/settings`}>
                                    <Button variant="pearl" size="icon" className="shadow-sm">
                                        <Settings size={20} />
                                    </Button>
                                </Link>
                            )}
                        </div>
                    </div>
                </div>

                {/* Tabs - Apple Style */}
                <div className="w-full flex items-center justify-center md:justify-start gap-8 h-12 border-t border-border">
                    <Link 
                        href={`/c/${community.slug}`} 
                        className="relative h-full flex items-center text-caption font-semibold text-primary"
                    >
                        Posts
                        <span className="absolute bottom-0 left-0 right-0 h-[2px] bg-primary rounded-full" />
                    </Link>
                    <Link 
                        href={`/c/${community.slug}/members`} 
                        className="h-full flex items-center text-caption font-semibold text-foreground-muted-48 hover:text-foreground transition-colors"
                    >
                        Members
                    </Link>
                </div>
            </div>
        </div>
    );
}

