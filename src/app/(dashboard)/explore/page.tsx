'use client';

import { Suspense } from 'react';
import { ExplorePostGrid } from '../../(components)/explore/ExplorePostGrid';
import { Compass } from 'lucide-react';

const ExplorePostGridSkeleton = () => (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-lg">
        {[...Array(9)].map((_, i) => (
            <div key={i} className="border border-hairline-soft rounded-xl bg-surface-soft p-4 h-[320px] animate-pulse" />
        ))}
    </div>
);

export default function ExplorePage() {
    return (
        <div className="w-full bg-canvas min-h-screen">
            {/* Header Section */}
            <section className="bg-canvas py-section-sm px-base md:px-xl border-b border-hairline-soft">
                <div className="max-w-6xl mx-auto flex flex-col md:flex-row md:items-end justify-between gap-xl">
                    <div className="max-w-2xl flex items-center gap-md">
                        <div className="w-14 h-14 bg-surface-soft rounded-circle flex items-center justify-center shrink-0 border border-hairline">
                            <Compass className="w-7 h-7 text-ink-deep" />
                        </div>
                        <div>
                            <h1 className="text-display-lg text-ink-deep mb-xs">Explore.</h1>
                            <p className="text-subtitle-md text-ink">Discover trending posts across campus</p>
                        </div>
                    </div>
                </div>
            </section>

            {/* Content Section */}
            <section className="py-section-sm px-base md:px-xl">
                <div className="w-full max-w-6xl mx-auto space-y-xl">
                    <Suspense fallback={<ExplorePostGridSkeleton />}>
                        <ExplorePostGrid />
                    </Suspense>
                </div>
            </section>
        </div>
    );
}
