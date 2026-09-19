'use client';

import { useQuery, useMutation } from '@/lib/api';
import { api } from '@/lib/api';
import type { Id } from '@/lib/api';
import { notFound } from 'next/navigation';
import { ArrowLeft, MapPin, Briefcase, DollarSign, Clock, Loader2, CheckCircle, FileText, Users } from 'lucide-react';
import Link from 'next/link';
import { formatDistanceToNow } from 'date-fns';
import { toast } from 'sonner';
import { useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';

type PageProps = {
 params: {
 id: Id<'jobs'>;
 };
};

const STATUS_STYLES: Record<string, string> = {
 pending: 'bg-muted text-muted-foreground',
 reviewed: 'bg-primary/10 text-primary',
 accepted: 'bg-green-500/10 text-green-500',
 rejected: 'bg-critical/10 text-critical',
};

function ApplicantsPanel({ jobId }: { jobId: string }) {
 const applications = useQuery(api.jobs.getJobApplications, { jobId });
 const updateStatus = useMutation(api.jobs.updateApplicationStatus);
 const queryClient = useQueryClient();

 const setStatus = async (applicationId: string, status: string) => {
 try {
 await updateStatus({ applicationId, status });
 queryClient.invalidateQueries();
 } catch (error) {
 toast.error('Failed to update application.', { description: (error as Error).message });
 }
 };

 return (
 <div className="mt-8 border-t pt-6">
 <h3 className="font-bold text-lg mb-4 flex items-center gap-2">
 <Users className="h-5 w-5" /> Applicants {Array.isArray(applications) && `(${applications.length})`}
 </h3>
 {applications === undefined ? (
 <p className="text-sm text-muted-foreground">Loading applicants...</p>
 ) : applications.length === 0 ? (
 <p className="text-sm text-muted-foreground">No one has applied yet.</p>
 ) : (
 <div className="space-y-3">
 {applications.map((application: any) => (
 <div key={application.id} className="border rounded-lg p-4">
 <div className="flex items-start justify-between gap-3">
 <div className="min-w-0">
 <Link href={`/profile/${application.applicant?.id ?? application.user_id}`} className="font-semibold hover:underline">
 {application.applicant?.name ?? 'Unknown applicant'}
 </Link>
 <p className="text-xs text-muted-foreground">
 {application.applicant?.university || application.applicant?.role} · applied{' '}
 <span suppressHydrationWarning>{formatDistanceToNow(new Date(application.created_at), { addSuffix: true })}</span>
 </p>
 </div>
 <span className={`px-2 py-1 rounded-full text-xs font-medium capitalize ${STATUS_STYLES[application.status] ?? STATUS_STYLES.pending}`}>
 {application.status}
 </span>
 </div>
 {application.cover_letter && (
 <p className="text-sm mt-3 whitespace-pre-wrap line-clamp-6">{application.cover_letter}</p>
 )}
 {application.resume_url && (
 <a href={application.resume_url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-xs text-primary hover:underline mt-2">
 <FileText className="h-3 w-3" /> Resume
 </a>
 )}
 <div className="flex gap-2 mt-3">
 {(['reviewed', 'accepted', 'rejected'] as const).map((status) => (
 <button
 key={status}
 disabled={application.status === status}
 onClick={() => setStatus(application.id, status)}
 className="px-3 py-1 rounded-md border text-xs font-medium capitalize hover:bg-muted disabled:opacity-40"
 >
 {status === 'reviewed' ? 'Mark reviewed' : status}
 </button>
 ))}
 </div>
 </div>
 ))}
 </div>
 )}
 </div>
 );
}

export default function JobDetailPage({ params }: PageProps) {
 const job = useQuery(api.jobs.getJobById, { id: params.id });
 const applyToJob = useMutation(api.jobs.applyToJob);
 const queryClient = useQueryClient();
 const [isApplying, setIsApplying] = useState(false);

 const handleApply = async () => {
 setIsApplying(true);
 try {
 await applyToJob({ jobId: params.id });
 toast.success("Application submitted successfully!");
 queryClient.invalidateQueries();
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
 const skills: string[] = job.skills ?? [];

 return (
 <div className="max-w-3xl mx-auto py-8 px-4">
 <Link href="/jobs" className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-4">
 <ArrowLeft className="h-4 w-4" />
 Back to all jobs
 </Link>

 <div className="bg-card border rounded-lg p-6">
 <div className="flex flex-col sm:flex-row gap-4 items-start">
 <div className="h-16 w-16 rounded-md bg-muted flex-shrink-0 flex items-center justify-center font-bold text-2xl">
 {job.company?.charAt(0)}
 </div>
 <div className="flex-1">
 <h1 className="text-2xl font-bold text-primary">{job.title}</h1>
 <p className="font-semibold text-lg">{job.company}</p>
 </div>
 <div className="mt-4 sm:mt-0">
 {job.isOwner ? (
 <span className="h-10 inline-flex items-center py-2 px-4 bg-muted text-muted-foreground rounded-md text-sm font-semibold">
 Your posting
 </span>
 ) : hasApplied ? (
 <span className="h-10 inline-flex items-center gap-2 py-2 px-4 bg-green-500/10 text-green-500 rounded-md text-sm font-semibold">
 <CheckCircle className="h-4 w-4" />
 Applied
 </span>
 ) : (
 <button onClick={handleApply} disabled={isApplying} className="h-10 py-2 px-4 active:scale-[0.98] bg-primary text-on-primary hover:bg-primary/90 rounded-md text-sm font-semibold flex items-center disabled:opacity-50">
 {isApplying && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
 Apply Now
 </button>
 )}
 </div>
 </div>

 <div className="flex flex-wrap gap-x-6 gap-y-2 text-sm text-muted-foreground my-6 border-y py-4">
 <div className="flex items-center gap-1.5"><MapPin className="h-4 w-4" /> {job.location} {job.remote && '(Remote)'}</div>
 <div className="flex items-center gap-1.5"><Briefcase className="h-4 w-4" /> {String(job.type).replace('_', ' ')}</div>
 {job.salary && <div className="flex items-center gap-1.5"><DollarSign className="h-4 w-4" /> {job.salary}</div>}
 {job.created_at && (
 <div className="flex items-center gap-1.5"><Clock className="h-4 w-4" /> Posted <span suppressHydrationWarning>{formatDistanceToNow(new Date(job.created_at), { addSuffix: true })}</span></div>
 )}
 </div>

 <div>
 <h3 className="font-bold text-lg mb-2">Job Description</h3>
 <p className="whitespace-pre-wrap prose prose-sm dark:prose-invert max-w-none">{job.description}</p>
 </div>

 {skills.length > 0 && (
 <div className="mt-6">
 <h3 className="font-bold text-lg mb-2">Skills Required</h3>
 <div className="flex flex-wrap gap-2">
 {skills.map((skill) => (
 <div key={skill} className="px-3 py-1 rounded-full text-sm font-medium bg-muted">
 {skill}
 </div>
 ))}
 </div>
 </div>
 )}

 {job.isOwner && <ApplicantsPanel jobId={params.id} />}
 </div>
 </div>
 );
}
