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
            className="group block bg-canvas border border-hairline rounded-lg overflow-hidden transition-all hover:shadow-product btn-press"
        >
            {/* Banner Area */}
            <div className="h-24 bg-canvas-parchment overflow-hidden relative">
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
                     <div className="h-16 w-16 rounded-md border-2 border-canvas bg-canvas-parchment shadow-sm overflow-hidden mx-auto">
                        {community.avatar ? (
                            <Image src={community.avatar} alt={community.name} width={64} height={64} className="h-full w-full object-cover" />
                        ) : (
                            <div className="h-full w-full flex items-center justify-center text-ink/20 font-display text-xl">
                                {community.name.charAt(0)}
                            </div>
                        )}
                    </div>
                </div>

                {/* Content */}
                <div className="text-center space-y-xs">
                    <h3 className="text-body-strong text-ink truncate px-1">
                        {community.name}
                    </h3>
                    <p className="text-caption text-ink-muted-48 line-clamp-2 min-h-[40px]">
                        {community.description}
                    </p>
                </div>

                {/* Stats */}
                <div className="flex items-center justify-center gap-2 mt-md text-fine-print text-ink-muted-48 font-semibold uppercase tracking-wider">
                    <Users className="h-3 w-3" />
                    <span>{community.memberCount} {community.memberCount === 1 ? 'member' : 'members'}</span>
                </div>

                {/* Action CTA */}
                <div className="mt-lg">
                    <div className={cn(
                        "w-full h-10 flex items-center justify-center rounded-pill text-caption-strong transition-colors",
                        community.viewerRole 
                            ? "bg-canvas-parchment text-ink" 
                            : "bg-primary text-white"
                    )}>
                        {community.viewerRole ? 'View' : 'Join'}
                    </div>
                </div>
            </div>
        </Link>
    );
}
