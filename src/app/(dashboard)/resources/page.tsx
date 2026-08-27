'use client';

import { useQuery } from '@/lib/api';
import { api } from '@/lib/api';
import { ResourceCard } from '../../(components)/resources/ResourceCard';
import Link from 'next/link';
import { Search, Plus, Book, FileText } from 'lucide-react';
import { useState } from 'react';
import { UploadResourceModal } from '@/components/resources/UploadResourceModal';

const ResourceCardSkeleton = () => <div className="p-4 border border-hairline-soft rounded-xl bg-surface-soft h-[192px] animate-pulse" />;

export default function ResourcesPage() {
 const [searchQuery, setSearchQuery] = useState('');
 const [courseFilter, setCourseFilter] = useState('');
 const [showUploadModal, setShowUploadModal] = useState(false);

 const resources = useQuery(api.resources.getResources, { 
 query: searchQuery || undefined, 
 course: courseFilter || undefined,
 });

 return (
 <div className="w-full bg-canvas min-h-screen">
 {/* Header Section */}
 <section className="bg-surface-soft py-6 px-4 md:px-8 border-b border-hairline shadow-sm">
 <div className="max-w-6xl mx-auto flex flex-col md:flex-row md:items-end justify-between gap-xl">
 <div className="max-w-2xl flex items-center gap-md">
 <div className="w-14 h-14 bg-surface-soft rounded-circle flex items-center justify-center shrink-0 border border-hairline">
 <Book className="w-7 h-7 text-ink-deep" />
 </div>
 <div>
 <h1 className="text-heading-lg font-bold text-ink-deep mb-1">Study Resources</h1>
 <p className="text-subtitle-md text-ink">Find and share notes, study guides, and more</p>
 </div>
 </div>
 <div className="flex gap-sm w-full md:w-auto">
 <button
 onClick={() => setShowUploadModal(true)}
 className="button-buy-cta flex-1 md:flex-none"
 >
 Upload Resource
 </button>
 </div>
 </div>
 </section>

 {/* Content Section */}
 <section className="py-section-sm px-base md:px-xl">
 <div className="w-full max-w-6xl mx-auto space-y-xl">
 {/* Search and Filter Controls */}
 <div className="flex flex-col md:flex-row gap-sm items-center justify-between pb-md border-b border-hairline">
 <div className="relative w-full md:flex-1 group">
 <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-steel group-focus-within:text-primary transition-colors" />
 <input
 type="text"
 value={searchQuery}
 onChange={(e) => setSearchQuery(e.target.value)}
 placeholder="Search resources..."
 className="w-full pl-12 pr-4 h-11 bg-surface-soft border border-hairline rounded-full text-[15px] focus:outline-none focus:border-primary focus:bg-canvas transition-all text-ink-deep placeholder:text-slate shadow-sm"
 />
 </div>
 
 <div className="relative w-full md:w-auto group">
 <FileText className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-steel group-focus-within:text-primary transition-colors" />
 <input
 type="text"
 value={courseFilter}
 onChange={(e) => setCourseFilter(e.target.value)}
 placeholder="Filter by course..."
 className="w-full pl-9 pr-4 h-[40px] bg-surface-soft border border-hairline rounded-full text-body-sm focus:outline-none focus:border-2 focus:border-fb-blue focus:bg-canvas transition-all text-ink placeholder:text-steel sm:w-48"
 />
 </div>
 </div>

 <div className="space-y-md">
 {resources === undefined && (
 <div className="grid grid-cols-1 md:grid-cols-2 gap-lg">
 {[...Array(6)].map((_, i) => <ResourceCardSkeleton key={i} />)}
 </div>
 )}
 
 {resources && resources.length > 0 && (
 <div className="text-caption-bold text-steel uppercase tracking-wide">
 {resources.length} {resources.length === 1 ? 'Resource' : 'Resources'}
 </div>
 )}
 
 <div className="grid grid-cols-1 md:grid-cols-2 gap-lg">
 {resources?.map((resource: any) => (
 <ResourceCard key={resource._id} resource={resource as any} />
 ))}
 </div>
 
 {resources?.length === 0 && (
 <div className="text-center py-section bg-surface-soft rounded-xxxl border border-hairline-soft">
 <Book className="w-16 h-16 text-steel/50 mx-auto mb-md" />
 <h3 className="text-heading-lg text-ink-deep mb-sm">No resources found</h3>
 <p className="text-body-md text-steel max-w-sm mx-auto mb-xl">
 Try adjusting your search or be the first to upload a new resource!
 </p>
 </div>
 )}
 </div>
 </div>
 </section>

 {showUploadModal && (
 <UploadResourceModal onClose={() => setShowUploadModal(false)} />
 )}
 </div>
 );
}

