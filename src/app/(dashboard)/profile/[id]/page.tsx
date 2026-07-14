import React, { Suspense } from 'react';
import type { Id } from '@/lib/api';
import { getUserById } from '@/server/db/users';
import { ProfileSkeleton } from '../../../(components)/profile/skeletons';
import { ProfileHeader } from '@/components/profile/ProfileHeader';
import { UserPostList } from '../../../(components)/profile/UserPostList';
import { ProfileSkillsSection } from '../../../(components)/profile/ProfileSkillsSection';
import { PortfolioSection } from '../../../(components)/profile/PortfolioSection';
import { notFound } from 'next/navigation';

type ProfilePageProps = {
    params: {
        id: Id<'users'>;
    };
};

async function ProfilePageContent({ userId }: { userId: Id<'users'> }) {
    let userProfile;
    try {
        userProfile = await getUserById(userId);
    } catch {
        notFound();
    }

    if (!userProfile) {
        notFound();
    }

    return (
        <div className="w-full min-h-screen bg-canvas">
            <ProfileHeader user={userProfile as any} />
            
            <main className="w-full flex flex-col items-center py-lg md:py-xl">
                <div className="w-full max-w-2xl px-4 md:px-0 space-y-xl">
                    
                    {/* Skills Section */}
                    <div className="w-full">
                        <div className="text-caption-bold text-steel uppercase tracking-wide mb-md border-b border-hairline pb-2">
                            Academic Expertise
                        </div>
                        <ProfileSkillsSection userId={userId} skills={(userProfile as any).skills || []} />
                    </div>

                    {/* Portfolio Section */}
                    <div className="w-full">
                        <div className="text-caption-bold text-steel uppercase tracking-wide mb-md border-b border-hairline pb-2">
                            Portfolio & Credentials
                        </div>
                        <PortfolioSection 
                            userId={userId} 
                            projects={(userProfile as any).projects || []} 
                            certifications={(userProfile as any).certifications || []} 
                        />
                    </div>

                    {/* Posts Section */}
                    <div className="w-full">
                        <div className="text-caption-bold text-steel uppercase tracking-wide mb-md border-b border-hairline pb-2">
                            Recent Contributions
                        </div>
                        <UserPostList userId={userId} />
                    </div>
                </div>
            </main>
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
