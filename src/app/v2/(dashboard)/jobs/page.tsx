'use client';

import { useQuery } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { JobCard } from '../../(components)/jobs/JobCard';
import Link from 'next/link';

const JobCardSkeleton = () => <div className="p-4 border rounded-lg bg-card h-[116px] animate-pulse" />;

export default function JobsPage() {
    // TODO: Add state for search and filters
    const jobs = useQuery(api.jobs.searchJobs, {});

    return (
        <div className="max-w-4xl mx-auto py-8 px-4">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
                <h1 className="text-3xl font-bold">Job Board</h1>
                <div className="flex gap-2">
                     <Link href="/jobs/my-applications">
                        <button className="h-10 py-2 px-4 btn-press border border-input bg-transparent hover:bg-accent hover:text-accent-foreground rounded-md text-sm font-semibold">
                            My Applications
                        </button>
                    </Link>
                    {/* TODO: Create /jobs/new page */}
                    <button className="h-10 py-2 px-4 btn-press bg-primary text-primary-foreground hover:bg-primary/90 rounded-md text-sm font-semibold">
                        Post a Job
                    </button>
                </div>
            </div>

            {/* TODO: Add search and filter controls */}

            <div className="space-y-4">
                 {jobs === undefined && (
                    [...Array(5)].map((_, i) => <JobCardSkeleton key={i} />)
                )}
                {jobs?.map(job => (
                    <JobCard key={job._id} job={job as any} />
                ))}
                {jobs?.length === 0 && (
                    <div className="text-center py-16">
                        <h3 className="text-lg font-semibold">No jobs found</h3>
                        <p className="text-muted-foreground mt-2">
                            Check back later or adjust your filters.
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
}
