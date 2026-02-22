'use client';

import { Suspense } from 'react';
import { ExplorePostGrid } from '../../(components)/explore/ExplorePostGrid';

const ExplorePostGridSkeleton = () => (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {[...Array(9)].map((_, i) => (
            <div key={i} className="border rounded-lg bg-card p-4 h-64 animate-pulse" />
        ))}
    </div>
);

export default function ExplorePage() {
    return (
        <div className="max-w-6xl mx-auto py-8 px-4">
            <h1 className="text-3xl font-bold mb-6">Explore</h1>
            <Suspense fallback={<ExplorePostGridSkeleton />}>
                <ExplorePostGrid />
            </Suspense>
        </div>
    );
}
