'use client';

import { useQuery } from '@/lib/api';
import { useUser } from '@/lib/auth/client';
import { api } from '@/lib/api';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

/**
 * /profile/me — redirects the signed-in user to their own profile page.
 */
export default function MyProfileRedirect() {
 const router = useRouter();
 const { isSignedIn, isLoaded } = useUser();
 const isAuthenticated = isSignedIn ?? false;
 const isLoading = !isLoaded;
 const currentUser = useQuery(api.users.getCurrentUser, isAuthenticated ? {} : 'skip');

 useEffect(() => {
    if (currentUser) {
      const myUserId = currentUser._id || currentUser.id || (currentUser as any).userId;
      if (myUserId && myUserId !== 'undefined') {
        router.replace(`/profile/${myUserId}`);
      }
    }
 }, [currentUser, router]);

 // Show sign-in prompt if auth resolved but user is not authenticated
 if (!isLoading && !isAuthenticated) {
 return (
 <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
 <p className="text-muted-foreground">Please sign in to view your profile.</p>
 <button
 onClick={() => router.push('/sign-in')}
 className="bg-primary text-white hover:bg-primary/90 font-semibold rounded-md px-4 py-2 shadow-sm transition-colors flex items-center justify-center"
 >
 Sign In
 </button>
 </div>
 );
 }

 return (
 <div className="flex items-center justify-center min-h-[60vh]">
 <div className="h-8 w-8 rounded-full border-4 border-fb-blue border-t-transparent animate-spin" />
 </div>
 );
}
