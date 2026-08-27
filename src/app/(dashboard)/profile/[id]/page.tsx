import React, { Suspense } from 'react';
import type { Id } from '@/lib/api';
import { getUserById } from '@/server/db/users';
import { getUserCommunities } from '@/server/db/communities';
import { ProfileSkeleton } from '../../../(components)/profile/skeletons';
import { ProfileHeader } from '@/components/profile/ProfileHeader';
import { UserPostList } from '../../../(components)/profile/UserPostList';
import { ProfileSkillsSection } from '../../../(components)/profile/ProfileSkillsSection';
import { PortfolioSection } from '../../../(components)/profile/PortfolioSection';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { BookOpen } from 'lucide-react';

type ProfilePageProps = {
  params: {
    id: Id<'users'>;
  };
};

async function ProfilePageContent({ userId }: { userId: Id<'users'> }) {
  let userProfile;
  let userCommunities: any[] = [];
  try {
    userProfile = await getUserById(userId);
    userCommunities = await getUserCommunities(userId);
  } catch {
    notFound();
  }

  if (!userProfile) {
    notFound();
  }

  const courses = userCommunities
    .map(c => c.community)
    .filter(c => c && c.category === "Course");

  return (
    <div className="w-full min-h-screen bg-canvas">
      <ProfileHeader user={{ ...userProfile, _id: userProfile.id || (userProfile as any)._id } as any} />
      
      <main className="w-full flex flex-col items-center py-lg md:py-xl">
        <div className="w-full max-w-2xl px-4 md:px-0 space-y-xl">
          
          {/* Courses Section */}
          <div className="w-full">
            <div className="text-caption-bold text-steel uppercase tracking-wide mb-md border-b border-hairline pb-2">
              Current Courses
            </div>
            {courses.length > 0 ? (
              <div className="flex flex-wrap gap-sm">
                {courses.map(course => (
                  <Link 
                    key={course.id} 
                    href={`/communities/${course.slug}`}
                    className="flex items-center gap-2 px-3 py-1.5 bg-surface-soft border border-hairline rounded-full hover:border-fb-blue transition-colors"
                  >
                    <BookOpen className="w-4 h-4 text-fb-blue" />
                    <span className="text-body-sm-bold text-ink-deep">{course.name}</span>
                  </Link>
                ))}
              </div>
            ) : (
              <p className="text-body-sm text-steel">No courses added yet.</p>
            )}
          </div>

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

