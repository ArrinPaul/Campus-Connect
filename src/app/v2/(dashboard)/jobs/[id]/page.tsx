'use client';

import { useQuery, useMutation } from 'convex/react';
import { api } from '@/convex/_generated/api';
import type { Id } from '@/convex/_generated/dataModel';
import { notFound } from 'next/navigation';
import { ArrowLeft, MapPin, Briefcase, DollarSign, Clock, Loader2, CheckCircle } from 'lucide-react';
import Link from 'next/link';
import { formatDistanceToNow } from 'date-fns';
import { toast } from 'sonner';
import { useState } from 'react';

type PageProps = {
    params: {
        id: Id<'jobs'>;
    };
};

export default function JobDetailPage({ params }: PageProps) {
    const job = useQuery(api.jobs.getJob, { jobId: params.id });
    const applyToJob = useMutation(api.jobs.applyToJob);
    const [isApplying, setIsApplying] = useState(false);

    const handleApply = async () => {
        setIsApplying(true);
        try {
            await applyToJob({ jobId: params.id });
            toast.success("Application submitted successfully!");
        } catch (error) {
            toast.error("Failed to submit application.", { description: (error as Error).message });
        } finally {
            setIsApplying(false);
        }
    };

    if (job === undefined) {
        return <div className="text-center py-16">Loading...</div>;
    }

    if (job === null) {
        notFound();
    }

    const hasApplied = !!job.viewerApplication;

    return (
        <div className="max-w-3xl mx-auto py-8 px-4">
             <Link href="/jobs" className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-4">
                <ArrowLeft className="h-4 w-4" />
                Back to all jobs
            </Link>

            <div className="bg-card border rounded-lg p-6">
                <div className="flex flex-col sm:flex-row gap-4 items-start">
                     <div className="h-16 w-16 rounded-md bg-muted flex-shrink-0 flex items-center justify-center font-bold text-2xl">
                        {job.company.charAt(0)}
                    </div>
                    <div className="flex-1">
                        <h1 className="text-2xl font-bold text-primary">{job.title}</h1>
                        <p className="font-semibold text-lg">{job.company}</p>
                    </div>
                    <div className="mt-4 sm:mt-0">
                        {hasApplied ? (
                             <span className="h-10 inline-flex items-center gap-2 py-2 px-4 bg-green-500/10 text-green-500 rounded-md text-sm font-semibold">
                                <CheckCircle className="h-4 w-4" />
                                Applied
                            </span>
                        ) : (
                            <button onClick={handleApply} disabled={isApplying} className="h-10 py-2 px-4 btn-press bg-primary text-primary-foreground hover:bg-primary/90 rounded-md text-sm font-semibold flex items-center disabled:opacity-50">
                                {isApplying && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                Apply Now
                            </button>
                        )}
                    </div>
                </div>

                <div className="flex flex-wrap gap-x-6 gap-y-2 text-sm text-muted-foreground my-6 border-y py-4">
                    <div className="flex items-center gap-1.5"><MapPin className="h-4 w-4" /> {job.location} {job.remote && '(Remote)'}</div>
                    <div className="flex items-center gap-1.5"><Briefcase className="h-4 w-4" /> {job.type}</div>
                    {job.salary && <div className="flex items-center gap-1.5"><DollarSign className="h-4 w-4" /> {job.salary}</div>}
                     <div className="flex items-center gap-1.5"><Clock className="h-4 w-4" /> Posted {formatDistanceToNow(new Date(job.createdAt), { addSuffix: true })}</div>
                </div>

                <div>
                    <h3 className="font-bold text-lg mb-2">Job Description</h3>
                    <p className="whitespace-pre-wrap prose prose-sm dark:prose-invert max-w-none">{job.description}</p>
                </div>

                {job.skillsRequired && job.skillsRequired.length > 0 && (
                    <div className="mt-6">
                        <h3 className="font-bold text-lg mb-2">Skills Required</h3>
                        <div className="flex flex-wrap gap-2">
                            {job.skillsRequired.map(skill => (
                                <div key={skill} className="px-3 py-1 rounded-full text-sm font-medium bg-muted">
                                    {skill}
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
