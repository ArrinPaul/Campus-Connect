'use client';

import type { Doc } from '@/convex/_generated/dataModel';
import Link from 'next/link';

// Simplified for search results
type User = Doc<'users'>; 

type Props = {
    user: User;
};

export function UserCard({ user }: Props) {
    return (
        <Link href={`/profile/${user._id}`} className="block p-4 border rounded-lg bg-card hover:bg-muted/50 transition-colors">
            <div className="flex items-center gap-3">
                <div className="h-12 w-12 rounded-full bg-muted flex-shrink-0">
                    {user.profilePicture && (
                        <img src={user.profilePicture} alt={user.name} className="h-full w-full rounded-full object-cover" />
                    )}
                </div>
                <div>
                    <p className="font-bold">{user.name}</p>
                    {user.username && <p className="text-sm text-muted-foreground">@{user.username}</p>}
                </div>
            </div>
             {user.bio && <p className="text-sm text-muted-foreground mt-2 line-clamp-2">{user.bio}</p>}
        </Link>
    );
}
