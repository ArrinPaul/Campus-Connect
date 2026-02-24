'use client';

import { useQuery } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { ResearchPaperCard } from '../../(components)/research/ResearchPaperCard';
import Link from 'next/link';
import { Search } from 'lucide-react';
import { useState } from 'react';
import { UploadPaperModal } from '@/components/research/UploadPaperModal';

const ResearchPaperCardSkeleton = () => <div className="p-4 border rounded-lg bg-card h-48 animate-pulse" />;

export default function ResearchPage() {
    const [searchQuery, setSearchQuery] = useState('');
    const [showUploadModal, setShowUploadModal] = useState(false);
    // TODO: Add state for search and filters
    const papers = useQuery(api.papers.searchPapers, { query: searchQuery || undefined });

    return (
        <div className="max-w-4xl mx-auto py-8 px-4">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
                <h1 className="text-3xl font-bold">Research Papers</h1>
                <div className="flex gap-2">
                    <button
                        onClick={() => setShowUploadModal(true)}
                        className="h-10 py-2 px-4 btn-press bg-primary text-primary-foreground hover:bg-primary/90 rounded-md text-sm font-semibold"
                    >
                        Upload Paper
                    </button>
                </div>
            </div>

            {showUploadModal && (
                <UploadPaperModal onClose={() => setShowUploadModal(false)} />
            )}

            <div className="relative mb-6">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search papers by title, author, or tags..."
                    className="w-full pl-10 pr-4 py-2.5 text-base bg-muted/50 rounded-full focus:outline-none focus:ring-1 focus:ring-primary"
                />
            </div>


            <div className="space-y-4">
                 {papers === undefined && (
                    [...Array(5)].map((_, i) => <ResearchPaperCardSkeleton key={i} />)
                )}
                {papers?.map(paper => (
                    <ResearchPaperCard key={paper._id} paper={paper as any} />
                ))}
                {papers?.length === 0 && (
                    <div className="text-center py-16">
                        <h3 className="text-lg font-semibold">No research papers found</h3>
                        <p className="text-muted-foreground mt-2">
                            Try adjusting your search or upload a new paper.
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
}
