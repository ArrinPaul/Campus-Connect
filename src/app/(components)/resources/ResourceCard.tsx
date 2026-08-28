'use client';

import Link from 'next/link';
import Image from 'next/image';
import type { Doc } from '@/lib/api';
import { BookOpen, User as UserIcon, Star, Download, FileText, ExternalLink } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

type Resource = Doc<'resources'> & {
    uploader: {
        name: string | null;
        profilePicture: string | null;
    } | null;
};

type Props = {
    resource: Resource;
};

export function ResourceCard({ resource }: Props) {
    const uploaderName = resource.uploader?.name || 'Anonymous';
    const uploaderAvatar = resource.uploader?.profilePicture;

    return (
        <Link href={`/resources/${resource._id}`} className="block p-4 border border-border rounded-lg bg-card hover:bg-surface-hover transition-colors shadow-sm">
            <h3 className="font-bold text-[17px] text-primary hover:underline line-clamp-2">{resource.title}</h3>
            <p className="text-[13px] text-muted-foreground mt-1.5 line-clamp-2 leading-relaxed">{resource.description}</p>
            
            <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground mt-3 font-semibold">
                {resource.course && (
                    <div className="flex items-center gap-1">
                        <BookOpen className="h-3.5 w-3.5" /> {resource.course}
                    </div>
                )}
                {resource.subject && (
                    <div className="flex items-center gap-1">
                        <FileText className="h-3.5 w-3.5" /> {resource.subject}
                    </div>
                )}
                <div className="flex items-center gap-1">
                    <Star className="h-3.5 w-3.5" /> {resource.rating.toFixed(1)} ({resource.ratingCount})
                </div>
                <div className="flex items-center gap-1">
                    <Download className="h-3.5 w-3.5" /> {resource.downloadCount}
                </div>
            </div>

            <div className="flex items-center gap-2 mt-3 text-xs text-muted-foreground border-t pt-3">
                 {uploaderAvatar ? (
                    <Image src={uploaderAvatar} alt={uploaderName} width={20} height={20} className="h-5 w-5 rounded-full object-cover" />
                ) : (
                    <UserIcon className="h-4 w-4" />
                )}
                <p>{uploaderName}</p>
                <span className="mx-1">â€¢</span>
                <p>Uploaded {formatDistanceToNow(new Date(resource.createdAt), { addSuffix: true })}</p>
                {resource.fileUrl && (
                    <span className="ml-auto text-primary flex items-center gap-1">
                        View Resource <ExternalLink className="h-3.5 w-3.5" />
                    </span>
                )}
            </div>
        </Link>
    );
}

