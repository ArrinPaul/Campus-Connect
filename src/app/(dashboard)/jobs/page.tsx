'use client';

import { useQuery } from '@/lib/api';
import { api } from '@/lib/api';
import { JobCard } from '../../(components)/jobs/JobCard';
import { PostJobModal } from '@/components/jobs/PostJobModal';
import Link from 'next/link';
import { useState, useEffect } from 'react';
import { Search, Filter, Briefcase } from 'lucide-react';

const JobCardSkeleton = () => <div className="p-4 border border-hairline-soft rounded-2xl bg-surface-soft h-[140px] animate-pulse" />;

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

    const jobs = useQuery(api.jobs.searchJobs, queryParams);

    return (
        <div className="max-w-4xl mx-auto py-8 px-4">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4">
                <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-primary/10 rounded-2xl flex items-center justify-center">
                        <Briefcase className="w-6 h-6 text-primary" />
                    </div>
                    <div>
                        <h1 className="text-3xl font-bold text-ink-deep tracking-tight">Job Board</h1>
                        <p className="text-steel text-sm">Find your next opportunity</p>
                    </div>
                </div>
                <div className="flex gap-2 w-full sm:w-auto">
                     <Link href="/jobs/my-applications" className="flex-1 sm:flex-none">
                        <button className="w-full h-10 py-2 px-4 btn-press border border-hairline-soft bg-canvas hover:bg-surface-soft rounded-lg text-sm font-semibold text-ink-deep shadow-subtle transition-all">
                            My Applications
                        </button>
                    </Link>
                    <button
                        onClick={() => setShowPostModal(true)}
                        className="flex-1 sm:flex-none h-10 py-2 px-4 btn-press bg-primary text-canvas hover:bg-primary-deep rounded-lg text-sm font-semibold shadow-subtle transition-all"
                    >
                        Post a Job
                    </button>
                </div>
            </div>

            {/* Search and Filter Controls */}
            <div className="flex flex-col sm:flex-row gap-4 mb-8 bg-surface-soft p-4 rounded-2xl border border-hairline-soft shadow-subtle">
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-steel" />
                    <input 
                        type="text" 
                        placeholder="Search for roles, companies..." 
                        className="w-full pl-10 pr-4 py-2.5 bg-canvas border border-hairline-soft rounded-xl text-sm focus:outline-none focus:border-primary-soft focus:ring-1 focus:ring-primary-soft transition-all text-ink-deep placeholder:text-steel/50"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
                <div className="relative w-full sm:w-48">
                    <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-steel pointer-events-none" />
                    <select 
                        className="w-full pl-9 pr-4 py-2.5 bg-canvas border border-hairline-soft rounded-xl text-sm focus:outline-none focus:border-primary-soft focus:ring-1 focus:ring-primary-soft appearance-none cursor-pointer transition-all text-ink-deep"
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

            <div className="space-y-4">
                 {jobs === undefined && (
                    [...Array(5)].map((_, i) => <JobCardSkeleton key={i} />)
                )}
                {jobs?.map((job: any) => (
                    <JobCard key={job.id || job._id} job={job as any} />
                ))}
                {jobs?.length === 0 && (
                    <div className="text-center py-20 bg-surface-soft rounded-3xl border border-hairline-soft shadow-subtle">
                        <Briefcase className="w-12 h-12 text-steel/40 mx-auto mb-4" />
                        <h3 className="text-xl font-bold text-ink-deep">No opportunities found</h3>
                        <p className="text-steel mt-2 max-w-sm mx-auto">
                            Try adjusting your search filters or check back later for new postings.
                        </p>
                        {(searchTerm || jobType !== 'All') && (
                            <button 
                                onClick={() => { setSearchTerm(''); setJobType('All'); }}
                                className="mt-6 text-primary font-semibold hover:underline"
                            >
                                Clear all filters
                            </button>
                        )}
                    </div>
                )}
            </div>

            {showPostModal && (
                <PostJobModal onClose={() => setShowPostModal(false)} />
            )}
        </div>
    );
}
