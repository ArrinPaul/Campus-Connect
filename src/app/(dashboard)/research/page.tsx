'use client';

import { useQuery } from '@/lib/api';
import { api } from '@/lib/api';
import { ResearchPaperCard } from '../../(components)/research/ResearchPaperCard';
import Link from 'next/link';
import { Search, Plus, BookOpen, Microscope } from 'lucide-react';
import { useState } from 'react';
import { UploadPaperModal } from '@/components/research/UploadPaperModal';

const ResearchPaperCardSkeleton = () => <div className="p-4 border border-hairline-soft rounded-xl bg-surface-soft h-[192px] animate-pulse" />;

export default function ResearchPage() {
    const [searchQuery, setSearchQuery] = useState('');
    const [showUploadModal, setShowUploadModal] = useState(false);
    // TODO: Add state for search and filters
    const papers = useQuery(api.papers.searchPapers, { query: searchQuery || undefined });

    return (
        <div className="w-full bg-canvas min-h-screen">
            {/* Header Section */}
            <section className="bg-canvas py-section-sm px-base md:px-xl border-b border-hairline-soft">
                <div className="max-w-6xl mx-auto flex flex-col md:flex-row md:items-end justify-between gap-xl">
                    <div className="max-w-2xl flex items-center gap-md">
                        <div className="w-14 h-14 bg-surface-soft rounded-circle flex items-center justify-center shrink-0 border border-hairline">
                            <Microscope className="w-7 h-7 text-ink-deep" />
                        </div>
                        <div>
                            <h1 className="text-display-lg text-ink-deep mb-xs">Research.</h1>
                            <p className="text-subtitle-md text-ink">Discover and share academic research</p>
                        </div>
                    </div>
                    <div className="flex gap-sm w-full md:w-auto">
                        <button
                            onClick={() => setShowUploadModal(true)}
                            className="button-buy-cta flex-1 md:flex-none"
                        >
                            Upload Paper
                        </button>
                    </div>
                </div>
            </section>

            {/* Content Section */}
            <section className="py-section-sm px-base md:px-xl">
                <div className="w-full max-w-6xl mx-auto space-y-xl">
                    {/* Search Controls */}
                    <div className="flex items-center justify-between pb-md border-b border-hairline">
                        <div className="relative w-full md:max-w-md group">
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-steel group-focus-within:text-primary transition-colors" />
                            <input
                                type="text"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                placeholder="Search papers by title, author, or tags..."
                                className="w-full pl-12 pr-4 h-[48px] bg-surface-soft border border-hairline rounded-full text-body-md focus:outline-none focus:border-2 focus:border-fb-blue focus:bg-canvas transition-all text-ink placeholder:text-steel"
                            />
                        </div>
                    </div>

                    <div className="space-y-md">
                         {papers === undefined && (
                            <div className="space-y-md">
                                {[...Array(4)].map((_, i) => <ResearchPaperCardSkeleton key={i} />)}
                            </div>
                        )}
                        
                        {papers && papers.length > 0 && (
                            <div className="text-caption-bold text-steel uppercase tracking-wide">
                                {papers.length} {papers.length === 1 ? 'Paper' : 'Papers'}
                            </div>
                        )}
                        
                        <div className="space-y-md">
                            {papers?.map((paper: any) => (
                                <ResearchPaperCard key={paper._id} paper={paper as any} />
                            ))}
                        </div>
                        
                        {papers?.length === 0 && (
                            <div className="text-center py-section bg-surface-soft rounded-xxxl border border-hairline-soft">
                                <BookOpen className="w-16 h-16 text-steel/50 mx-auto mb-md" />
                                <h3 className="text-heading-lg text-ink-deep mb-sm">No research papers found</h3>
                                <p className="text-body-md text-steel max-w-sm mx-auto mb-xl">
                                    Try adjusting your search or be the first to upload a new paper!
                                </p>
                            </div>
                        )}
                    </div>
                </div>
            </section>
            
            {showUploadModal && (
                <UploadPaperModal onClose={() => setShowUploadModal(false)} />
            )}
        </div>
    );
}
