'use client';

import { useQuery } from 'convex/react';
import { api } from '@/convex/_generated/api';
import Link from 'next/link';
import { ArrowLeft, CheckCircle, Clock, Eye, XCircle } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';

const statusStyles: Record<string, { icon: typeof Clock; text: string; color: string; bg: string }> = {
    applied: { icon: Clock, text: 'Applied', color: 'text-blue-500', bg: 'bg-blue-500/10' },
    viewed: { icon: Eye, text: 'Viewed', color: 'text-purple-500', bg: 'bg-purple-500/10' },
    shortlisted: { icon: CheckCircle, text: 'Shortlisted', color: 'text-green-500', bg: 'bg-green-500/10' },
    rejected: { icon: XCircle, text: 'Rejected', color: 'text-red-500', bg: 'bg-red-500/10' },
};

export default function MyApplicationsPage() {
    const applications = useQuery(api.jobs.getUserApplications);

    return (
        <div className="max-w-4xl mx-auto py-8 px-4">
             <Link href="/jobs" className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-4">
                <ArrowLeft className="h-4 w-4" />
                Back to job board
            </Link>
            <h1 className="text-3xl font-bold mb-6">My Applications</h1>

            <div className="border bg-card rounded-lg">
                {applications === undefined && (
                    <div className="p-8 text-center">Loading applications...</div>
                )}

                {applications && applications.length === 0 && (
                     <div className="p-8 text-center">
                        <h3 className="text-lg font-semibold">No applications yet</h3>
                        <p className="text-muted-foreground mt-2">
                            You haven&apos;t applied to any jobs.
                        </p>
                    </div>
                )}
                
                <ul className="divide-y">
                    {applications?.map(app => {
                        if (!app.job) return null; // Don't render if job has been deleted
                        
                        const status = statusStyles[app.status];
                        const StatusIcon = status.icon;

                        return (
                            <li key={app._id}>
                                <Link href={`/jobs/${app.job._id}`} className="block p-4 hover:bg-muted/50 transition-colors">
                                    <div className="flex flex-col sm:flex-row justify-between sm:items-start gap-2">
                                        <div>
                                            <p className="font-bold text-primary">{app.job.title}</p>
                                            <p className="font-semibold">{app.job.company}</p>
                                            <p className="text-sm text-muted-foreground">{app.job.location}</p>
                                        </div>
                                        <div className={cn("flex items-center gap-1.5 text-xs font-semibold py-1 px-2 rounded-full", status.bg, status.color)}>
                                            <StatusIcon className="h-3.5 w-3.5" />
                                            {status.text}
                                        </div>
                                    </div>
                                    <p className="text-xs text-muted-foreground mt-2">
                                        Applied on {format(new Date(app.createdAt), 'MMM d, yyyy')}
                                    </p>
                                </Link>
                            </li>
                        );
                    })}
                </ul>
            </div>
        </div>
    );
}
