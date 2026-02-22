import React, { Suspense } from 'react';
import { fetchQuery } from 'convex/nextjs';
import { api } from '@/convex/_generated/api';
import type { Id } from '@/convex/_generated/dataModel';
import { ProfileSkeleton } from '../../../(components)/profile/skeletons';
import { ProfileHeader } from '../../../(components)/profile/ProfileHeader';
import { UserPostList } from '../../../(components)/profile/UserPostList';
import { notFound } from 'next/navigation';

type ProfilePageProps = {
    params: {
        id: Id<'users'>;
    };
};

async function ProfilePageContent({ userId }: { userId: Id<'users'> }) {
    const userProfile = await fetchQuery(api.users.getUserById, { userId });

    if (!userProfile) {
        notFound();
    }

    return (
        <div>
            <ProfileHeader profile={userProfile} />
            <div className="px-4 sm:px-6 lg:px-8 mt-6">
                <div className="border-b">
                    <nav className="flex gap-4" aria-label="Profile tabs">
                        <button className="py-3 px-1 border-b-2 border-primary text-primary font-semibold">Posts</button>
                        <button className="py-3 px-1 border-b-2 border-transparent text-muted-foreground hover:text-foreground">Portfolio</button>
                        <button className="py-3 px-1 border-b-2 border-transparent text-muted-foreground hover:text-foreground">Activity</button>
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
            {/* @ts-expect-error Server Component */}
            <ProfilePageContent userId={params.id} />
        </Suspense>
    );
}
