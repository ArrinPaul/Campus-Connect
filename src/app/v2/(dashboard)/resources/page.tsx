'use client';

import { useQuery } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { ResourceCard } from '../../(components)/resources/ResourceCard';
import Link from 'next/link';
import { Search, Plus } from 'lucide-react';
import { useState } from 'react';

const ResourceCardSkeleton = () => <div className="p-4 border rounded-lg bg-card h-48 animate-pulse" />;

export default function ResourcesPage() {
    const [searchQuery, setSearchQuery] = useState('');
    const [courseFilter, setCourseFilter] = useState('');

    const resources = useQuery(api.resources.getResources, { 
        query: searchQuery || undefined, 
        course: courseFilter || undefined,
    });

    return (
        <div className="max-w-4xl mx-auto py-8 px-4">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
                <h1 className="text-3xl font-bold">Study Resources</h1>
                <div className="flex gap-2">
                     {/* TODO: Create /resources/upload page */}
                    <button className="h-10 py-2 px-4 btn-press bg-primary text-primary-foreground hover:bg-primary/90 rounded-md text-sm font-semibold">
                        Upload Resource
                    </button>
                </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-4 mb-6">
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                    <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="Search resources by title, description, or subject..."
                        className="w-full pl-10 pr-4 py-2.5 text-base bg-muted/50 rounded-full focus:outline-none focus:ring-1 focus:ring-primary"
                    />
                </div>
                <input
                    type="text"
                    value={courseFilter}
                    onChange={(e) => setCourseFilter(e.target.value)}
                    placeholder="Filter by course..."
                    className="w-full sm:w-auto px-3 py-2.5 text-base bg-muted/50 rounded-full focus:outline-none focus:ring-1 focus:ring-primary"
                />
            </div>


            <div className="space-y-4">
                 {resources === undefined && (
                    [...Array(5)].map((_, i) => <ResourceCardSkeleton key={i} />)
                )}
                {resources?.map(resource => (
                    <ResourceCard key={resource._id} resource={resource as any} />
                ))}
                {resources?.length === 0 && (
                    <div className="text-center py-16">
                        <h3 className="text-lg font-semibold">No resources found</h3>
                        <p className="text-muted-foreground mt-2">
                            Try uploading a resource or adjusting your filters.
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
}
