'use client';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

// This component redirects the old sub-page to the new unified settings page with the correct tab selected.
export default function RedirectToSettings() {
    const router = useRouter();
    useEffect(() => {
        router.replace('/settings?tab=notifications');
    }, [router]);
    return <div>Redirecting...</div>;
}
