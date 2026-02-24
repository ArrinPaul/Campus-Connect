import React, { Suspense } from 'react';
import { fetchQuery } from 'convex/nextjs';
import { api } from '@/convex/_generated/api';
import type { Id } from '@/convex/_generated/dataModel';
import { ProfileSkeleton } from '../../../../(components)/profile/skeletons';
import { ProfileHeader } from '@/components/profile/ProfileHeader';
import { UserActivityFeed } from '../../../../(components)/profile/UserActivityFeed';
import { notFound } from 'next/navigation';
import Link from 'next/link';

type ActivityPageProps = {
    params: {
        id: Id<'users'>;
    };
};

async function ActivityPageContent({ userId }: { userId: Id<'users'> }) {
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
            <div className="px-4 sm:px-6 lg:px-8 mt-6">
                <div className="border-b">
                    <nav className="flex gap-4" aria-label="Profile tabs">
                        <Link href={`/profile/${userId}`} className="py-3 px-1 border-b-2 border-transparent text-muted-foreground hover:text-foreground">Posts</Link>
                        <span className="py-3 px-1 border-b-2 border-primary text-primary font-semibold cursor-default">Activity</span>
                        <Link href={`/profile/${userId}/portfolio`} className="py-3 px-1 border-b-2 border-transparent text-muted-foreground hover:text-foreground">Portfolio</Link>
                    </nav>
                </div>

                <UserActivityFeed userId={userId} />
            </div>
        </div>
    );
}

export default function ActivityPage({ params }: ActivityPageProps) {
    return (
        <Suspense fallback={<ProfileSkeleton />}>
            <ActivityPageContent userId={params.id} />
        </Suspense>
    );
}
