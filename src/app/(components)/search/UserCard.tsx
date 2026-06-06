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
    return (
        <Link 
            href={`/profile/${user._id}`} 
            className="group block p-lg bg-canvas border border-hairline rounded-lg transition-all hover:shadow-product btn-press"
        >
            <div className="flex items-center gap-4">
                {/* Avatar */}
                <div className="h-14 w-14 rounded-full overflow-hidden border border-hairline bg-canvas-parchment shadow-sm flex-shrink-0">
                    {user.profilePicture ? (
                        <Image 
                            src={user.profilePicture} 
                            alt={user.name} 
                            width={56} 
                            height={56} 
                            className="h-full w-full object-cover" 
                        />
                    ) : (
                        <div className="h-full w-full flex items-center justify-center text-ink/20 font-bold text-xl uppercase">
                            {user.name.charAt(0)}
                        </div>
                    )}
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                    <div className="flex items-baseline gap-2">
                        <h3 className="text-body-strong text-ink truncate group-hover:text-primary transition-colors">
                            {user.name}
                        </h3>
                        {user.username && (
                            <span className="text-caption text-ink-muted-48 truncate">
                                @{user.username}
                            </span>
                        )}
                    </div>
                    {user.bio && (
                        <p className="text-caption text-ink-muted-48 mt-0.5 line-clamp-1 italic">
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
                <div className="flex-shrink-0 text-ink-muted-48 opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition-all">
                    <ChevronRight size={20} />
                </div>
            </div>
        </Link>
    );
}
