'use client';

import { useQuery } from 'convex/react';
import { api } from '@/convex/_generated/api';
import type { Id } from '@/convex/_generated/dataModel';
import { notFound } from 'next/navigation';
import { ArrowLeft, BookOpen, ExternalLink, Hash, GitPullRequest, User as UserIcon, Calendar } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import { format } from 'date-fns';

type PageProps = {
    params: {
        id: Id<'papers'>;
    };
};

export default function ResearchDetailPage({ params }: PageProps) {
    const paper = useQuery(api.papers.getPaper, { paperId: params.id });

    if (paper === undefined) {
        return <div className="text-center py-16">Loading...</div>;
    }

    if (paper === null) {
        notFound();
    }

    return (
        <div className="max-w-4xl mx-auto py-8 px-4">
             <Link href="/research" className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-4">
                <ArrowLeft className="h-4 w-4" />
                Back to research papers
            </Link>

            <div className="bg-card border rounded-lg p-6">
                <h1 className="text-3xl font-bold text-primary mb-2">{paper.title}</h1>
                
                <div className="flex flex-wrap gap-x-6 gap-y-2 text-sm text-muted-foreground my-4 border-y py-4">
                    <div className="flex items-center gap-1.5"><BookOpen className="h-4 w-4" /> {paper.authors.join(', ')}</div>
                    <div className="flex items-center gap-1.5"><Calendar className="h-4 w-4" /> Uploaded {format(new Date(paper.createdAt), 'MMM d, yyyy')}</div>
                    {paper.doi && (
                        <a href={`https://doi.org/${paper.doi}`} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 hover:underline">
                            <ExternalLink className="h-4 w-4" /> DOI: {paper.doi}
                        </a>
                    )}
                    {paper.pdfUrl && (
                        <a href={paper.pdfUrl} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 hover:underline">
                            <ExternalLink className="h-4 w-4" /> View PDF
                        </a>
                    )}
                </div>

                <div>
                    <h3 className="font-bold text-lg mb-2">Abstract</h3>
                    <p className="whitespace-pre-wrap">{paper.abstract}</p>
                </div>

                {paper.tags && paper.tags.length > 0 && (
                    <div className="mt-6">
                        <h3 className="font-bold text-lg mb-2">Tags</h3>
                        <div className="flex flex-wrap gap-2">
                            {paper.tags.map(tag => (
                                <Link href={`/hashtag/${tag}`} key={tag} className="px-3 py-1 rounded-full text-sm font-medium bg-muted hover:bg-muted/80">
                                    #{tag}
                                </Link>
                            ))}
                        </div>
                    </div>
                )}

                {paper.lookingForCollaborators && (
                    <div className="mt-6 inline-flex items-center gap-2 px-4 py-2 rounded-full bg-blue-500/10 text-blue-500 text-base font-medium">
                        <GitPullRequest className="h-5 w-5" /> Looking for Collaborators
                    </div>
                )}

                {paper.uploader && (
                    <div className="mt-6 border-t pt-6 flex items-center gap-3">
                        <div className="h-10 w-10 rounded-full bg-muted">
                            {paper.uploader.profilePicture && (
                                <Image src={paper.uploader.profilePicture} alt={paper.uploader.name ?? ''} width={40} height={40} className="h-full w-full rounded-full object-cover" />
                            )}
                        </div>
                        <div>
                            <p className="text-sm text-muted-foreground">Uploaded by</p>
                            <Link href={`/profile/${paper.uploader._id}`} className="font-bold hover:underline">{paper.uploader.name}</Link>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
