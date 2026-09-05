'use client';

import type { Doc } from '@/lib/api';
import Link from 'next/link';
import Image from 'next/image';
import { cn } from '@/lib/utils';
import { ChevronRight } from 'lucide-react';

// Simplified for search results
type User = Doc<'users'>; 

type Props = {
    user: User;
};

export function UserCard({ user }: Props) {
    const userId = (user as any).id || user._id || (user as any).userId;
    const profilePicture = (user as any).profile_picture || user.profilePicture;
    return (
        <Link 
            href={`/profile/${userId}`} 
            className="group block p-4 bg-card border border-border rounded-lg transition-all shadow-sm hover:shadow-md cursor-pointer"
        >
            <div className="flex items-center gap-4">
                {/* Avatar */}
                <div className="h-14 w-14 rounded-full overflow-hidden border border-border bg-muted shadow-sm flex-shrink-0">
                    {profilePicture ? (
                        <Image
                            src={profilePicture}
                            alt={user.name} 
                            width={56} 
                            height={56} 
                            className="h-full w-full object-cover" 
                        />
                    ) : (
                        <div className="h-full w-full flex items-center justify-center text-foreground/20 font-bold text-xl uppercase">
                            {user.name.charAt(0)}
                        </div>
                    )}
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                    <div className="flex items-baseline gap-2">
                        <h3 className="text-[17px] font-bold text-foreground truncate group-hover:underline transition-colors">
                            {user.name}
                        </h3>
                        {user.username && (
                            <span className="text-caption text-foreground-muted-48 truncate">
                                @{user.username}
                            </span>
                        )}
                    </div>
                    {user.bio && (
                        <p className="text-xs text-muted-foreground mt-1 line-clamp-1">
                            {user.bio}
                        </p>
                    )}
                    <div className="flex items-center gap-2 mt-2">
                         <span className="text-[10px] text-primary font-bold uppercase tracking-widest border border-primary/20 bg-primary/5 px-2 py-0.5 rounded-pill">
                            {user.role}
                         </span>
                    </div>
                </div>

                {/* Indicator */}
                <div className="flex-shrink-0 text-foreground-muted-48 opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition-all">
                    <ChevronRight size={20} />
                </div>
            </div>
        </Link>
    );
}

