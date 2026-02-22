'use client';

import Link from 'next/link';
import Image from 'next/image';
import type { Doc } from '@/convex/_generated/dataModel';
import { Award, User as UserIcon, GraduationCap } from 'lucide-react';

type LeaderboardEntry = Doc<'users'> & {
    rank: number;
    reputation: number;
    level: number;
    achievementCount: number;
};

type Props = {
    entry: LeaderboardEntry;
};

export function LeaderboardItem({ entry }: Props) {
    const avatar = entry.profilePicture;
    const name = entry.name || 'Anonymous';
    const username = entry.username;

    return (
        <Link href={`/profile/${entry._id}`} className="flex items-center gap-4 p-4 border rounded-lg bg-card hover:bg-muted/50 transition-colors">
            <span className="font-bold text-lg text-primary w-8 text-center flex-shrink-0">#{entry.rank}</span>
            <div className="h-12 w-12 rounded-full bg-muted flex-shrink-0">
                {avatar ? (
                    <Image src={avatar} alt={name} width={48} height={48} className="h-full w-full rounded-full object-cover" />
                ) : (
                    <UserIcon className="h-8 w-8 text-muted-foreground" />
                )}
            </div>
            <div className="flex-1">
                <p className="font-bold">{name}</p>
                {username && <p className="text-sm text-muted-foreground">@{username}</p>}
                {entry.university && <p className="text-xs text-muted-foreground">{entry.university}</p>}
            </div>
            <div className="flex items-center gap-2 text-sm text-muted-foreground flex-shrink-0">
                <Award className="h-4 w-4" /> {entry.reputation} Rep
            </div>
            <div className="flex items-center gap-2 text-sm text-muted-foreground flex-shrink-0">
                <GraduationCap className="h-4 w-4" /> Level {entry.level}
            </div>
        </Link>
    );
}
