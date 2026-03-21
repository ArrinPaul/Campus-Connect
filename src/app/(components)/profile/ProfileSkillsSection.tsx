'use client';

import { useQuery } from '@/lib/api';
import { useUser } from '@/lib/auth/client';
import { api } from '@/lib/api';
import type { Id } from '@/lib/api';
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
