'use client';

import { useQuery } from 'convex/react';
import { useUser } from '@clerk/nextjs';
import { api } from '@/convex/_generated/api';
import type { Id } from '@/convex/_generated/dataModel';
import { SkillEndorsements } from '@/components/profile/SkillEndorsements';
import { SkillsManager } from '@/components/profile/SkillsManager';

interface ProfileSkillsSectionProps {
    userId: Id<'users'>;
    skills: string[];
}

export function ProfileSkillsSection({ userId, skills }: ProfileSkillsSectionProps) {
    const { isLoaded, isSignedIn } = useUser();
    const currentUser = useQuery(
        api.users.getCurrentUser,
        isLoaded && isSignedIn ? {} : 'skip'
    );

    const isOwnProfile = currentUser?._id === userId;

    return (
        <div className="mt-4">
            <SkillEndorsements userId={userId} isOwnProfile={isOwnProfile} />
            {isOwnProfile && (
                <div className="mt-4">
                    <SkillsManager skills={skills} />
                </div>
            )}
        </div>
    );
}
