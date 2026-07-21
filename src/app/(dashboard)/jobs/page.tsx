'use client';

import { useQuery } from '@/lib/api';
import { api } from '@/lib/api';
import { JobCard } from '../../(components)/jobs/JobCard';
import { PostJobModal } from '@/components/jobs/PostJobModal';
import Link from 'next/link';
import { useState, useEffect } from 'react';
import { Search, Filter, Briefcase, Plus, Sparkles, X } from 'lucide-react';
import { cn } from '@/lib/utils';

const JOB_TYPES = ['All', 'Full-time', 'Part-time', 'Internship', 'Contract'];

const JobCardSkeleton = () => (
  <div className="p-5 border border-hairline rounded-2xl bg-surface-soft h-[150px] animate-pulse" />
);

export default function JobsPage() {
  const [showPostModal, setShowPostModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const [jobType, setJobType] = useState('All');

  // Debounce search
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

  const hasActiveFilters = searchTerm.length > 0 || jobType !== 'All';

  return (
    <div className="w-full bg-canvas min-h-screen pb-16">
      {/* Header Section */}
      <section className="bg-canvas pt-8 pb-6 px-4 md:px-8 border-b border-hairline">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl md:text-4xl font-bold text-ink-deep tracking-tight">Job Board</h1>
            <p className="text-sm text-slate mt-1 max-w-xl">
              Explore internships, full-time positions, and project opportunities on campus.
            </p>
          </div>
          <div className="flex items-center gap-3 shrink-0">
            <Link href="/jobs/my-applications">
              <button className="rounded-full border border-hairline bg-surface-soft px-4 py-2 text-xs font-semibold text-ink-deep hover:bg-canvas hover:border-primary/40 active:scale-[0.97] transition-all cursor-pointer">
                My Applications
              </button>
            </Link>
            <button
              onClick={() => setShowPostModal(true)}
              className="flex items-center gap-1.5 rounded-full bg-primary px-5 py-2 text-xs font-bold text-white shadow-md hover:bg-primary/90 active:scale-[0.97] transition-all cursor-pointer"
            >
              <Plus size={16} /> Post a Job
            </button>
          </div>
        </div>
      </section>

      {/* Content Section */}
      <section className="pt-6 px-4 md:px-8">
        <div className="w-full max-w-6xl mx-auto space-y-6">
          {/* Controls Row */}
          <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
            {/* Search Bar */}
            <div className="relative w-full md:max-w-md group">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate group-focus-within:text-primary transition-colors" />
              <input
                type="text"
                placeholder="Search roles, companies, keywords..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-11 pr-10 h-11 rounded-full border border-hairline bg-surface-soft text-xs text-ink-deep placeholder:text-slate focus:outline-none focus:border-primary focus:bg-canvas transition-all"
              />
              {searchTerm && (
                <button
                  onClick={() => setSearchTerm('')}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 p-1 rounded-full hover:bg-canvas text-slate"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              )}
            </div>

            {/* Filter Pill Tabs */}
            <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none w-full md:w-auto">
              {JOB_TYPES.map((type) => (
                <button
                  key={type}
                  onClick={() => setJobType(type)}
                  className={cn(
                    "px-4 py-1.5 rounded-full text-xs font-semibold transition-all shrink-0 cursor-pointer active:scale-[0.96]",
                    jobType === type
                      ? "bg-primary text-white shadow-sm"
                      : "bg-surface-soft text-slate border border-hairline hover:border-primary/40 hover:text-primary"
                  )}
                >
                  {type}
                </button>
              ))}
            </div>
          </div>

          {/* Active Filters Bar */}
          {hasActiveFilters && (
            <div className="flex items-center gap-2 text-xs text-slate">
              <span>Active filters:</span>
              {jobType !== 'All' && (
                <span className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
                  {jobType}
                  <X size={12} className="cursor-pointer hover:opacity-80" onClick={() => setJobType('All')} />
                </span>
              )}
              {searchTerm && (
                <span className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
                  &quot;{searchTerm}&quot;
                  <X size={12} className="cursor-pointer hover:opacity-80" onClick={() => setSearchTerm('')} />
                </span>
              )}
              <button
                onClick={() => { setJobType('All'); setSearchTerm(''); }}
                className="text-xs text-primary hover:underline ml-2 font-semibold"
              >
                Reset
              </button>
            </div>
          )}

          {/* Job Listings Grid */}
          <div className="space-y-4">
            {jobs === undefined ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {[...Array(6)].map((_, i) => <JobCardSkeleton key={i} />)}
              </div>
            ) : jobs.length === 0 ? (
              <div className="text-center py-16 bg-surface-soft rounded-2xl border border-hairline max-w-lg mx-auto">
                <Briefcase className="h-12 w-12 mx-auto mb-3 text-slate opacity-40" />
                <h3 className="text-base font-semibold text-ink-deep">No opportunities found</h3>
                <p className="text-xs text-slate mt-1 max-w-xs mx-auto">
                  {hasActiveFilters
                    ? 'Try adjusting your search terms or job type filter.'
                    : 'Check back later for new job postings.'}
                </p>
                {hasActiveFilters && (
                  <button
                    onClick={() => { setSearchTerm(''); setJobType('All'); }}
                    className="mt-4 rounded-full border border-hairline px-4 py-1.5 text-xs font-semibold text-ink-deep hover:bg-canvas transition-colors"
                  >
                    Clear Filters
                  </button>
                )}
              </div>
            ) : (
              <>
                <div className="text-xs font-bold text-slate uppercase tracking-wider">
                  {jobs.length} {jobs.length === 1 ? 'Opportunity' : 'Opportunities'}
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {jobs.map((job: any) => (
                    <div key={job.id || job._id} className="transition-transform duration-200 hover:-translate-y-1">
                      <JobCard job={job as any} />
                    </div>
                  ))}
                </div>
              </>
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
