'use client';

import Link from 'next/link';
import Image from 'next/image';
import type { Doc } from '@/convex/_generated/dataModel';
import { Users } from 'lucide-react';

// Manually defining type based on getCommunities query
type Community = Doc<'communities'> & {
    viewerRole: string | null;
};

type Props = {
    community: Community;
};

export function CommunityCard({ community }: Props) {
    return (
        <Link href={`/c/${community.slug}`} className="block border rounded-lg bg-card hover:bg-muted/50 transition-colors overflow-hidden">
            <div className="h-20 bg-muted" style={{ backgroundImage: `url(${community.banner})`, backgroundSize: 'cover', backgroundPosition: 'center' }} />
            <div className="p-4">
                <div className="-mt-10">
                     <div className="h-16 w-16 rounded-md border-4 border-card bg-muted mx-auto">
                        {community.avatar && <Image src={community.avatar} alt={community.name} width={64} height={64} className="h-full w-full rounded-sm object-cover" />}
                    </div>
                </div>
                <h3 className="text-center font-bold mt-2 truncate">{community.name}</h3>
                <p className="text-center text-xs text-muted-foreground mt-1 line-clamp-2 h-8">{community.description}</p>
                <div className="flex items-center justify-center gap-2 mt-3 text-xs text-muted-foreground">
                    <Users className="h-3 w-3" />
                    <span>{community.memberCount} {community.memberCount === 1 ? 'member' : 'members'}</span>
                </div>
                 <div className="mt-4">
                    <div className="w-full h-9 flex items-center justify-center rounded-md bg-primary/10 text-primary text-sm font-semibold">
                        {community.viewerRole ? 'View' : 'Join'}
                    </div>
                 </div>
            </div>
        </Link>
    );
}
