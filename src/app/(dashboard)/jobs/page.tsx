'use client';

import { useQuery } from '@/lib/api';
import { api } from '@/lib/api';
import { JobCard } from '../../(components)/jobs/JobCard';
import { PostJobModal } from '@/components/jobs/PostJobModal';
import Link from 'next/link';
import { useState, useEffect } from 'react';
import { Search, Filter, Briefcase } from 'lucide-react';

const JobCardSkeleton = () => <div className="p-4 border border-hairline-soft rounded-xl bg-surface-soft h-[140px] animate-pulse" />;

export default function JobsPage() {
    const [showPostModal, setShowPostModal] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [debouncedQuery, setDebouncedQuery] = useState('');
    const [jobType, setJobType] = useState('All');

    // Debounce the search input to avoid spamming the API
    useEffect(() => {
        const handler = setTimeout(() => {
            setDebouncedQuery(searchTerm);
        }, 300);
        return () => clearTimeout(handler);
    }, [searchTerm]);

    const queryParams: any = {};
    if (debouncedQuery) queryParams.q = debouncedQuery;
    if (jobType !== 'All') queryParams.type = jobType;

    const jobs = useQuery(api.jobs.getJobs, queryParams);

    return (
        <div className="w-full bg-canvas min-h-screen">
            {/* Header Section */}
            <section className="bg-canvas py-section-sm px-base md:px-xl border-b border-hairline-soft">
                <div className="max-w-6xl mx-auto flex flex-col md:flex-row md:items-end justify-between gap-xl">
                    <div className="max-w-2xl flex items-center gap-md">
                        <div className="w-14 h-14 bg-surface-soft rounded-circle flex items-center justify-center shrink-0 border border-hairline">
                            <Briefcase className="w-7 h-7 text-ink-deep" />
                        </div>
                        <div>
                            <h1 className="text-display-lg text-ink-deep mb-xs">Job Board.</h1>
                            <p className="text-subtitle-md text-ink">Find your next opportunity</p>
                        </div>
                    </div>
                    <div className="flex gap-sm w-full md:w-auto">
                        <Link href="/jobs/my-applications" className="flex-1 md:flex-none">
                            <button className="button-secondary w-full">
                                My Applications
                            </button>
                        </Link>
                        <button
                            onClick={() => setShowPostModal(true)}
                            className="button-buy-cta flex-1 md:flex-none"
                        >
                            Post a Job
                        </button>
                    </div>
                </div>
            </section>

            {/* Content Section */}
            <section className="py-section-sm px-base md:px-xl">
                <div className="w-full max-w-6xl mx-auto space-y-xl">
                    {/* Search and Filter Controls */}
                    <div className="flex flex-col md:flex-row gap-sm items-center justify-between pb-md border-b border-hairline">
                        <div className="relative w-full md:max-w-md group">
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-steel group-focus-within:text-primary transition-colors" />
                            <input 
                                type="text" 
                                placeholder="Search roles, companies..." 
                                className="w-full pl-12 pr-4 h-[48px] bg-surface-soft border border-hairline rounded-full text-body-md focus:outline-none focus:border-2 focus:border-fb-blue focus:bg-canvas transition-all text-ink placeholder:text-steel"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>
                        
                        <div className="flex items-center gap-2 w-full md:w-auto bg-surface-soft rounded-lg p-xs border border-hairline shrink-0">
                            <Filter className="w-4 h-4 text-steel ml-2" />
                            <select 
                                className="text-body-sm-bold text-ink bg-transparent px-2 py-1 focus:outline-none appearance-none cursor-pointer"
                                value={jobType}
                                onChange={(e) => setJobType(e.target.value)}
                            >
                                <option value="All">All Types</option>
                                <option value="Full-time">Full-time</option>
                                <option value="Part-time">Part-time</option>
                                <option value="Internship">Internship</option>
                                <option value="Contract">Contract</option>
                            </select>
                        </div>
                    </div>

                    <div className="space-y-md">
                         {jobs === undefined && (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-lg">
                                {[...Array(6)].map((_, i) => <JobCardSkeleton key={i} />)}
                            </div>
                        )}
                        
                        {jobs && jobs.length > 0 && (
                            <div className="text-caption-bold text-steel uppercase tracking-wide">
                                {jobs.length} {jobs.length === 1 ? 'Opportunity' : 'Opportunities'}
                            </div>
                        )}

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-lg">
                            {jobs?.map((job: any) => (
                                <JobCard key={job.id || job._id} job={job as any} />
                            ))}
                        </div>

                        {jobs?.length === 0 && (
                            <div className="text-center py-section bg-surface-soft rounded-xxxl border border-hairline-soft">
                                <Briefcase className="w-16 h-16 text-steel/50 mx-auto mb-md" />
                                <h3 className="text-heading-lg text-ink-deep mb-sm">No opportunities found</h3>
                                <p className="text-body-md text-steel max-w-sm mx-auto mb-xl">
                                    Try adjusting your search filters or check back later for new postings.
                                </p>
                                {(searchTerm || jobType !== 'All') && (
                                    <button 
                                        onClick={() => { setSearchTerm(''); setJobType('All'); }}
                                        className="button-secondary"
                                    >
                                        Clear all filters
                                    </button>
                                )}
                            </div>
                        )}
                    </div>
                </div>
            </section>

            {showPostModal && (
                <PostJobModal onClose={() => setShowPostModal(false)} />
            )}
        </div>
    );
}
