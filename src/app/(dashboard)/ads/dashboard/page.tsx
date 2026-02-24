'use client';

import { useQuery } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { AdCard } from '../../../(components)/ads/AdCard';
import Link from 'next/link';
import { Plus } from 'lucide-react';

const AdCardSkeleton = () => <div className="p-4 border rounded-lg bg-card h-64 animate-pulse" />;

export default function AdsDashboardPage() {
    const ads = useQuery(api.ads.getAdAnalytics, {});

    return (
        <div className="max-w-6xl mx-auto py-8 px-4">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
                <h1 className="text-3xl font-bold">Ad Dashboard</h1>
                <div className="flex gap-2">
                     <Link href="/ads/create">
                        <button className="h-10 py-2 px-4 btn-press bg-primary text-primary-foreground hover:bg-primary/90 rounded-md text-sm font-semibold">
                            <Plus className="h-4 w-4 mr-2" /> Create New Ad
                        </button>
                    </Link>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                 {ads === undefined && (
                    [...Array(3)].map((_, i) => <AdCardSkeleton key={i} />)
                )}
                {ads?.map(ad => (
                    <AdCard key={ad.adId} ad={ad as any} />
                ))}
                {ads?.length === 0 && (
                    <div className="text-center py-16 col-span-full">
                        <h3 className="text-lg font-semibold">No ads created yet</h3>
                        <p className="text-muted-foreground mt-2">
                            Start creating ads to reach your target audience.
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
}
