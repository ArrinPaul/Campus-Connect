'use client';

import Link from 'next/link';
import type { Doc } from '@/convex/_generated/dataModel';
import { MapPin, Briefcase, DollarSign, Clock } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

// Manually defining type based on searchJobs query
type Job = Doc<'jobs'> & {
    poster: {
        name: string | null;
        profilePicture: string | null;
    } | null;
};

type Props = {
    job: Job;
};

export function JobCard({ job }: Props) {
    return (
        <Link href={`/jobs/${job._id}`} className="block p-4 border rounded-lg bg-card hover:bg-muted/50 transition-colors">
            <div className="flex gap-4">
                <div className="h-12 w-12 rounded-md bg-muted flex-shrink-0 flex items-center justify-center font-bold text-lg">
                    {job.company.charAt(0)}
                </div>
                <div className="flex-1">
                    <p className="font-bold text-primary">{job.title}</p>
                    <p className="font-semibold">{job.company}</p>
                    <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-muted-foreground mt-2">
                        <div className="flex items-center gap-1.5"><MapPin className="h-3.5 w-3.5" /> {job.location} {job.remote && '(Remote)'}</div>
                        <div className="flex items-center gap-1.5"><Briefcase className="h-3.5 w-3.5" /> {job.type}</div>
                        {job.salary && <div className="flex items-center gap-1.5"><DollarSign className="h-3.5 w-3.5" /> {job.salary}</div>}
                    </div>
                </div>
            </div>
             <div className="text-xs text-muted-foreground mt-3 flex items-center gap-1">
                <Clock className="h-3 w-3" /> Posted {formatDistanceToNow(new Date(job.createdAt), { addSuffix: true })}
            </div>
        </Link>
    );
}
