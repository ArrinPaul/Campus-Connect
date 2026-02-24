import React, { Suspense } from 'react';
import { fetchQuery } from 'convex/nextjs';
import { api } from '@/convex/_generated/api';
import type { Id } from '@/convex/_generated/dataModel';
import { ProfileSkeleton } from '../../../(components)/profile/skeletons';
import { ProfileHeader } from '@/components/profile/ProfileHeader';
import { UserPostList } from '../../../(components)/profile/UserPostList';
import { ProfileSkillsSection } from '../../../(components)/profile/ProfileSkillsSection';
import { ProfileBadges } from '../../../(components)/profile/ProfileBadges';
import { notFound } from 'next/navigation';
import Link from 'next/link';

type ProfilePageProps = {
    params: {
        id: Id<'users'>;
    };
};

async function ProfilePageContent({ userId }: { userId: Id<'users'> }) {
    let userProfile;
    try {
        userProfile = await fetchQuery(api.users.getUserById, { userId });
    } catch {
        notFound();
    }

    if (!userProfile) {
        notFound();
    }

    return (
        <div>
            <ProfileHeader user={userProfile as any} />
            <div className="px-4 sm:px-6 lg:px-8">
                <ProfileSkillsSection userId={userId} skills={(userProfile as any).skills || []} />
            </div>
            <div className="px-4 sm:px-6 lg:px-8 mt-4">
                <ProfileBadges userId={userId} />
            </div>
            <div className="px-4 sm:px-6 lg:px-8 mt-6">
                <div className="border-b">
                    <nav className="flex gap-4" aria-label="Profile tabs">
                        <span className="py-3 px-1 border-b-2 border-primary text-primary font-semibold cursor-default">Posts</span>
                        <Link href={`/profile/${userId}/activity`} className="py-3 px-1 border-b-2 border-transparent text-muted-foreground hover:text-foreground">Activity</Link>
                        <Link href={`/profile/${userId}/portfolio`} className="py-3 px-1 border-b-2 border-transparent text-muted-foreground hover:text-foreground">Portfolio</Link>
                    </nav>
                </div>

                <UserPostList userId={userId} />
            </div>
        </div>
    );
}

export default function ProfilePage({ params }: ProfilePageProps) {
    return (
        <Suspense fallback={<ProfileSkeleton />}>
            <ProfilePageContent userId={params.id} />
        </Suspense>
    );
}
