'use client';

import Link from 'next/link';
import Image from 'next/image';
import type { Doc } from '@/lib/api';
import { Users } from 'lucide-react';
import { cn } from '@/lib/utils';

// Manually defining type based on getCommunities query
type Community = Doc<'communities'> & {
    viewerRole: string | null;
};

type Props = {
    community: Community;
};

export function CommunityCard({ community }: Props) {
    return (
        <Link 
            href={`/c/${community.slug}`} 
            className="group block bg-card border border-border rounded-lg overflow-hidden transition-all shadow-sm hover:shadow-md"
        >
            {/* Banner Area */}
            <div className="h-24 bg-card-parchment overflow-hidden relative">
                {community.banner && (
                    <Image 
                        src={community.banner} 
                        alt="" 
                        fill 
                        className="object-cover opacity-80 group-hover:opacity-100 transition-opacity" 
                    />
                )}
            </div>
            
            <div className="p-lg pt-0 relative">
                {/* Avatar Overlay */}
                <div className="-mt-8 mb-md relative z-10">
                     <div className="h-16 w-16 rounded-lg border-4 border-surface-soft bg-muted shadow-sm overflow-hidden mx-auto">
                        {community.avatar ? (
                            <Image src={community.avatar} alt={community.name} width={64} height={64} className="h-full w-full object-cover" />
                        ) : (
                            <div className="h-full w-full flex items-center justify-center text-foreground/20 font-display text-xl">
                                {community.name.charAt(0)}
                            </div>
                        )}
                    </div>
                </div>

                {/* Content */}
                <div className="text-center space-y-xs">
                    <h3 className="text-[17px] font-bold text-foreground truncate px-1 leading-tight">
                        {community.name}
                    </h3>
                    <p className="text-xs text-muted-foreground line-clamp-2 min-h-[32px] mt-1">
                        {community.description}
                    </p>
                </div>

                {/* Stats */}
                <div className="flex items-center justify-center gap-2 mt-4 text-[11px] text-muted-foreground font-semibold uppercase tracking-wider">
                    <Users className="h-3 w-3" />
                    <span>{community.memberCount} {community.memberCount === 1 ? 'member' : 'members'}</span>
                </div>

                {/* Action CTA */}
                <div className="mt-lg">
                    <div className={cn(
                        "w-full h-10 flex items-center justify-center rounded-pill text-caption-strong transition-colors",
                        community.viewerRole 
                            ? "bg-card-parchment text-foreground" 
                            : "bg-primary text-white"
                    )}>
                        {community.viewerRole ? 'View' : 'Join'}
                    </div>
                </div>
            </div>
        </Link>
    );
}

