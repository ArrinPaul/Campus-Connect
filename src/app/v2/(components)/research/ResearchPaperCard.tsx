'use client';

import Link from 'next/link';
import type { Doc } from '@/convex/_generated/dataModel';
import { FileText, User as UserIcon, Calendar, BookOpen, ExternalLink, Hash, GitPullRequest } from 'lucide-react';
import { format } from 'date-fns';

type Paper = Doc<'papers'> & {
    uploader?: {
        name: string | null;
        profilePicture: string | null;
    } | null;
};

type Props = {
    paper: Paper;
};

export function ResearchPaperCard({ paper }: Props) {
    return (
        <Link href={`/research/${paper._id}`} className="block p-4 border rounded-lg bg-card hover:bg-muted/50 transition-colors">
            <h3 className="font-bold text-lg text-primary line-clamp-2">{paper.title}</h3>
            <p className="text-sm text-muted-foreground mt-1 line-clamp-3">{paper.abstract}</p>
            
            <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground mt-3">
                <div className="flex items-center gap-1">
                    <BookOpen className="h-3.5 w-3.5" /> {paper.authors.join(', ')}
                </div>
                <div className="flex items-center gap-1">
                    <Calendar className="h-3.5 w-3.5" /> Uploaded {format(new Date(paper.createdAt), 'MMM d, yyyy')}
                </div>
                {paper.doi && (
                    <div className="flex items-center gap-1">
                        <ExternalLink className="h-3.5 w-3.5" /> DOI: {paper.doi}
                    </div>
                )}
            </div>

            {paper.tags && paper.tags.length > 0 && (
                <div className="flex flex-wrap gap-1 mt-3">
                    {paper.tags.map(tag => (
                        <span key={tag} className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-muted text-xs text-muted-foreground">
                            <Hash className="h-3 w-3" /> {tag}
                        </span>
                    ))}
                </div>
            )}

            {paper.lookingForCollaborators && (
                <div className="mt-3 inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-blue-500/10 text-blue-500 text-xs font-medium">
                    <GitPullRequest className="h-3.5 w-3.5" /> Looking for Collaborators
                </div>
            )}
        </Link>
    );
}
