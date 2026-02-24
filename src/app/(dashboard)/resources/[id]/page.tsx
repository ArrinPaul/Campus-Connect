'use client';

import { Suspense, useState } from 'react';
import { useQuery, useMutation } from 'convex/react';
import { useConvexAuth } from 'convex/react';
import { api } from '@/convex/_generated/api';
import type { Id } from '@/convex/_generated/dataModel';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import {
    ArrowLeft,
    BookOpen,
    FileText,
    Star,
    Download,
    ExternalLink,
    User as UserIcon,
    Calendar,
    Trash2,
    Loader2,
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { toast } from 'sonner';

type PageProps = {
    params: { id: string };
};

function StarRating({
    value,
    onChange,
    disabled,
}: {
    value: number;
    onChange: (v: number) => void;
    disabled?: boolean;
}) {
    const [hover, setHover] = useState(0);

    return (
        <div className="flex items-center gap-0.5">
            {[1, 2, 3, 4, 5].map((star) => (
                <button
                    key={star}
                    type="button"
                    disabled={disabled}
                    onClick={() => onChange(star)}
                    onMouseEnter={() => setHover(star)}
                    onMouseLeave={() => setHover(0)}
                    className="p-0.5 disabled:cursor-not-allowed disabled:opacity-50 transition-transform hover:scale-110"
                >
                    <Star
                        className={`h-6 w-6 transition-colors ${
                            star <= (hover || value)
                                ? 'text-yellow-500 fill-yellow-500'
                                : 'text-muted-foreground/30'
                        }`}
                    />
                </button>
            ))}
        </div>
    );
}

function ResourceDetailSkeleton() {
    return (
        <div className="max-w-3xl mx-auto py-8 px-4">
            <div className="h-6 w-32 bg-muted animate-pulse rounded mb-6" />
            <div className="h-10 w-3/4 bg-muted animate-pulse rounded mb-4" />
            <div className="h-4 w-1/2 bg-muted animate-pulse rounded mb-6" />
            <div className="h-32 bg-muted animate-pulse rounded-lg mb-6" />
            <div className="h-20 bg-muted animate-pulse rounded-lg" />
        </div>
    );
}

function ResourceDetailContent({ id }: { id: string }) {
    const { isAuthenticated } = useConvexAuth();
    const resource = useQuery(
        api.resources.getResource,
        isAuthenticated ? { resourceId: id as Id<'resources'> } : 'skip'
    );
    const currentUser = useQuery(api.users.getCurrentUser, isAuthenticated ? {} : 'skip');
    const rateResource = useMutation(api.resources.rateResource);
    const downloadResource = useMutation(api.resources.downloadResource);
    const deleteResource = useMutation(api.resources.deleteResource);

    const [userRating, setUserRating] = useState(0);
    const [isRating, setIsRating] = useState(false);
    const [isDownloading, setIsDownloading] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);

    if (resource === undefined) {
        return <ResourceDetailSkeleton />;
    }

    if (resource === null) {
        notFound();
    }

    const isOwner = currentUser && resource.uploadedBy === currentUser._id;

    const handleRate = async (rating: number) => {
        setUserRating(rating);
        setIsRating(true);
        try {
            await rateResource({ resourceId: resource._id, rating });
            toast.success(`Rated ${rating} star${rating !== 1 ? 's' : ''}`);
        } catch (err: any) {
            toast.error(err.message || 'Failed to rate');
            setUserRating(0);
        } finally {
            setIsRating(false);
        }
    };

    const handleDownload = async () => {
        if (!resource.fileUrl) return;
        setIsDownloading(true);
        try {
            await downloadResource({ resourceId: resource._id });
            window.open(resource.fileUrl, '_blank');
        } catch (err: any) {
            toast.error(err.message || 'Failed to download');
        } finally {
            setIsDownloading(false);
        }
    };

    const handleDelete = async () => {
        if (!confirm('Are you sure you want to delete this resource? This cannot be undone.')) return;
        setIsDeleting(true);
        try {
            await deleteResource({ resourceId: resource._id });
            toast.success('Resource deleted');
            window.location.href = '/resources';
        } catch (err: any) {
            toast.error(err.message || 'Failed to delete');
            setIsDeleting(false);
        }
    };

    return (
        <div className="max-w-3xl mx-auto py-8 px-4">
            {/* Back link */}
            <Link
                href="/resources"
                className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-6"
            >
                <ArrowLeft className="h-4 w-4" />
                Back to Resources
            </Link>

            {/* Title & Meta */}
            <div className="flex items-start justify-between gap-4 mb-4">
                <h1 className="text-3xl font-bold">{resource.title}</h1>
                {isOwner && (
                    <button
                        onClick={handleDelete}
                        disabled={isDeleting}
                        className="flex items-center gap-1.5 px-3 py-1.5 text-sm text-red-600 border border-red-200 dark:border-red-900/50 rounded-md hover:bg-red-500/10 disabled:opacity-50 transition-colors flex-shrink-0"
                    >
                        {isDeleting ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                            <Trash2 className="h-4 w-4" />
                        )}
                        Delete
                    </button>
                )}
            </div>

            {/* Tags */}
            <div className="flex flex-wrap gap-2 mb-6">
                {resource.course && (
                    <span className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-primary/10 text-primary text-xs font-medium">
                        <BookOpen className="h-3.5 w-3.5" />
                        {resource.course}
                    </span>
                )}
                {resource.subject && (
                    <span className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-muted text-muted-foreground text-xs font-medium">
                        <FileText className="h-3.5 w-3.5" />
                        {resource.subject}
                    </span>
                )}
            </div>

            {/* Description */}
            <div className="rounded-lg border bg-card p-6 mb-6">
                <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">
                    Description
                </h2>
                <p className="text-sm leading-relaxed whitespace-pre-wrap">{resource.description}</p>
            </div>

            {/* Stats Card */}
            <div className="rounded-lg border bg-card p-6 mb-6">
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-center">
                    <div>
                        <div className="flex items-center justify-center gap-1 text-yellow-500 mb-1">
                            <Star className="h-5 w-5 fill-yellow-500" />
                            <span className="text-xl font-bold">{resource.rating.toFixed(1)}</span>
                        </div>
                        <p className="text-xs text-muted-foreground">
                            {resource.ratingCount} rating{resource.ratingCount !== 1 ? 's' : ''}
                        </p>
                    </div>
                    <div>
                        <div className="flex items-center justify-center gap-1 text-primary mb-1">
                            <Download className="h-5 w-5" />
                            <span className="text-xl font-bold">{resource.downloadCount}</span>
                        </div>
                        <p className="text-xs text-muted-foreground">downloads</p>
                    </div>
                    <div>
                        <div className="flex items-center justify-center gap-1 text-muted-foreground mb-1">
                            <Calendar className="h-5 w-5" />
                        </div>
                        <p className="text-xs text-muted-foreground">
                            {formatDistanceToNow(new Date(resource.createdAt), { addSuffix: true })}
                        </p>
                    </div>
                    <div>
                        <Link
                            href={`/profile/${resource.uploadedBy}`}
                            className="flex flex-col items-center gap-1 hover:text-primary transition-colors"
                        >
                            {resource.uploader?.profilePicture ? (
                                <Image
                                    src={resource.uploader.profilePicture}
                                    alt={resource.uploader.name || ''}
                                    width={28}
                                    height={28}
                                    className="h-7 w-7 rounded-full object-cover"
                                />
                            ) : (
                                <UserIcon className="h-5 w-5 text-muted-foreground" />
                            )}
                            <p className="text-xs text-muted-foreground truncate max-w-[100px]">
                                {resource.uploader?.name || 'Anonymous'}
                            </p>
                        </Link>
                    </div>
                </div>
            </div>

            {/* Actions */}
            <div className="rounded-lg border bg-card p-6 space-y-5">
                {/* Download */}
                {resource.fileUrl ? (
                    <div>
                        <h3 className="text-sm font-semibold mb-2">Download Resource</h3>
                        <button
                            onClick={handleDownload}
                            disabled={isDownloading}
                            className="flex items-center gap-2 px-4 py-2.5 rounded-md bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 disabled:opacity-50 transition-colors"
                        >
                            {isDownloading ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                                <Download className="h-4 w-4" />
                            )}
                            Download File
                        </button>
                    </div>
                ) : (
                    <div>
                        <h3 className="text-sm font-semibold mb-2">File</h3>
                        <p className="text-sm text-muted-foreground">No file attached to this resource.</p>
                    </div>
                )}

                {/* Rating */}
                <div className="border-t pt-5">
                    <h3 className="text-sm font-semibold mb-2">Rate this Resource</h3>
                    <StarRating value={userRating} onChange={handleRate} disabled={isRating} />
                    {userRating > 0 && (
                        <p className="text-xs text-muted-foreground mt-1">
                            You rated this {userRating}/5
                        </p>
                    )}
                </div>
            </div>
        </div>
    );
}

export default function ResourceDetailPage({ params }: PageProps) {
    return (
        <Suspense fallback={<ResourceDetailSkeleton />}>
            <ResourceDetailContent id={params.id} />
        </Suspense>
    );
}
