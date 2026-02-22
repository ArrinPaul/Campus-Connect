'use client';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

// This component redirects the old /discover page to the new /explore page.
export default function RedirectToExplore() {
    const router = useRouter();
    useEffect(() => {
        router.replace('/explore');
    }, [router]);
    return <div>Redirecting to Explore...</div>;
}
