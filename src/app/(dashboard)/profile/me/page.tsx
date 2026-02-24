'use client';

import { useQuery } from 'convex/react';
import { useConvexAuth } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

/**
 * /profile/me — redirects the signed-in user to their own profile page.
 */
export default function MyProfileRedirect() {
  const router = useRouter();
  const { isAuthenticated, isLoading } = useConvexAuth();
  const currentUser = useQuery(api.users.getCurrentUser, isAuthenticated ? {} : 'skip');

  useEffect(() => {
    if (currentUser) {
      router.replace(`/profile/${currentUser._id}`);
    }
  }, [currentUser, router]);

  // Show sign-in prompt if auth resolved but user is not authenticated
  if (!isLoading && !isAuthenticated) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <p className="text-muted-foreground">Please sign in to view your profile.</p>
        <button
          onClick={() => router.push('/sign-in')}
          className="px-4 py-2 bg-primary text-primary-foreground rounded-md text-sm font-semibold"
        >
          Sign In
        </button>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <div className="h-8 w-8 rounded-full border-4 border-primary border-t-transparent animate-spin" />
    </div>
  );
}
