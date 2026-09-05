'use client';

import { useQuery } from '@/lib/api';
import { api } from '@/lib/api';
import { ResearchPaperCard } from '../../(components)/research/ResearchPaperCard';
import Link from 'next/link';
import { Search, Plus, BookOpen, Microscope } from 'lucide-react';
import { EmptyState } from '@/components/ui/empty-state';
import { useState } from 'react';
import { UploadPaperModal } from '@/components/research/UploadPaperModal';

const ResearchPaperCardSkeleton = () => <div className="p-4 border border-border/50 rounded-lg bg-card h-[192px] animate-pulse" />;

export default function ResearchPage() {
 const [searchQuery, setSearchQuery] = useState('');
 const [showUploadModal, setShowUploadModal] = useState(false);
 // TODO: Add state for search and filters
 const papers = useQuery(api.papers.searchPapers, { query: searchQuery || undefined });

 return (
 <div className="w-full bg-canvas min-h-screen">
 {/* Header Section */}
 <section className="bg-card py-6 px-4 md:px-8 border-b border-border shadow-sm">
 <div className="max-w-6xl mx-auto flex flex-col md:flex-row md:items-end justify-between gap-xl">
 <div className="max-w-2xl flex items-center gap-md">
 <div className="w-14 h-14 bg-card rounded-circle flex items-center justify-center shrink-0 border border-border">
 <Microscope className="w-7 h-7 text-foreground" />
 </div>
 <div>
 <h1 className="text-heading-lg font-bold text-foreground mb-1">Research Hub</h1>
 <p className="text-subtitle-md text-foreground">Discover and share academic research</p>
 </div>
 </div>
 <div className="flex gap-sm w-full md:w-auto">
 <button
 onClick={() => setShowUploadModal(true)}
 className="bg-primary text-white hover:bg-primary/90 font-semibold rounded-md px-4 py-2 shadow-sm transition-colors flex items-center justify-center flex-1 md:flex-none"
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
 <div className="flex items-center justify-between pb-4 border-b border-border">
 <div className="relative w-full md:max-w-md group">
 <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground group-focus-within:text-primary transition-colors" />
 <input
 type="text"
 value={searchQuery}
 onChange={(e) => setSearchQuery(e.target.value)}
 placeholder="Search papers by title, author, or tags..."
 className="w-full pl-12 pr-4 h-11 bg-card border border-border rounded-full text-[15px] focus:outline-none focus:border-primary focus:bg-canvas transition-all text-foreground placeholder:text-muted-foreground shadow-sm"
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
 <div className="text-caption-bold text-muted-foreground uppercase tracking-wide">
 {papers.length} {papers.length === 1 ? 'Paper' : 'Papers'}
 </div>
 )}
 
 <div className="space-y-md">
 {papers?.map((paper: any) => (
 <ResearchPaperCard key={paper._id} paper={paper as any} />
 ))}
 </div>
 
 {papers?.length === 0 && (
 <EmptyState
 icon={BookOpen}
 title="No research papers found"
 description="Try adjusting your search or be the first to upload a new paper!"
 />
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

