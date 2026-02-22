'use client';

import type { Doc } from '@/convex/_generated/dataModel';
import { Users, Rss, Settings, Lock } from 'lucide-react';
import Link from 'next/link';

// Manually defining type based on getCommunity query
type Community = Doc<'communities'> & {
    viewerRole: string | null;
};

type Props = {
    community: Community;
};

export function CommunityHeader({ community }: Props) {
    // TODO: Add Join/Leave logic
    const isMember = community.viewerRole === 'member' || community.viewerRole === 'admin' || community.viewerRole === 'owner';

    const typeInfo = {
        public: { icon: Users, text: 'Public' },
        private: { icon: Lock, text: 'Private' },
        secret: { icon: Rss, text: 'Secret' },
    }

    return (
        <div>
            <div className="h-48 w-full bg-muted" style={{ backgroundImage: `url(${community.banner})`, backgroundSize: 'cover', backgroundPosition: 'center' }} />
            <div className="bg-card">
                <div className="max-w-4xl mx-auto px-4">
                     <div className="flex items-end gap-4 -mt-16">
                        <div className="h-32 w-32 rounded-md border-4 border-card bg-muted flex-shrink-0">
                            {community.avatar && <img src={community.avatar} alt={community.name} className="h-full w-full rounded-sm object-cover" />}
                        </div>
                    </div>
                    <div className="mt-4 flex flex-col md:flex-row justify-between md:items-start">
                        <div className="flex-1">
                            <h1 className="text-3xl font-bold">{community.name}</h1>
                             <div className="flex items-center gap-4 text-sm text-muted-foreground mt-2">
                                <div className="flex items-center gap-1.5"><Users className="h-4 w-4"/> {community.memberCount} members</div>
                                <div className="flex items-center gap-1.5">
                                    {React.createElement(typeInfo[community.type].icon, { className: 'h-4 w-4' })}
                                    {typeInfo[community.type].text}
                                </div>
                            </div>
                            <p className="text-sm mt-2">{community.description}</p>
                        </div>
                        <div className="mt-4 md:mt-0">
                             <button className="h-10 w-full md:w-auto py-2 px-4 btn-press bg-primary text-primary-foreground hover:bg-primary/90 rounded-md text-sm font-semibold">
                                {isMember ? 'Joined' : 'Join'}
                            </button>
                        </div>
                    </div>
                     <div className="mt-4 border-b">
                        <nav className="flex gap-4" aria-label="Community tabs">
                            <Link href={`/c/${community.slug}`} className="py-3 px-1 border-b-2 border-primary text-primary font-semibold">Posts</Link>
                            <Link href={`/c/${community.slug}/members`} className="py-3 px-1 border-b-2 border-transparent text-muted-foreground hover:text-foreground">Members</Link>
                            {community.viewerRole === 'admin' || community.viewerRole === 'owner' ? (
                                <Link href={`/c/${community.slug}/settings`} className="py-3 px-1 border-b-2 border-transparent text-muted-foreground hover:text-foreground">Settings</Link>
                            ) : null}
                        </nav>
                    </div>
                </div>
            </div>
        </div>
    );
}
