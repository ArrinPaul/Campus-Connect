'use client';

import { useQuery } from '@/lib/api';
import { api } from '@/lib/api';
import { QuestionCard } from '../../(components)/q-and-a/QuestionCard';
import { AskQuestionModal } from '@/components/q-and-a/AskQuestionModal';
import Link from 'next/link';
import { Search, Plus, HelpCircle, Filter, Hash } from 'lucide-react';
import { useState } from 'react';

const QuestionCardSkeleton = () => <div className="p-4 border border-hairline-soft rounded-xl bg-surface-soft h-[192px] animate-pulse" />;

export default function QuestionsPage() {
 const [searchQuery, setSearchQuery] = useState('');
 const [sortOption, setSortOption] = useState('newest');
 const [tagFilter, setTagFilter] = useState('');
 const [showAskModal, setShowAskModal] = useState(false);

 const questions = useQuery(api.questions.getQuestions, { 
 query: searchQuery || undefined, 
 sort: sortOption as any,
 tag: tagFilter || undefined,
 });

 return (
 <div className="w-full bg-canvas min-h-screen">
 {/* Header Section */}
 <section className="bg-surface-soft py-6 px-4 md:px-8 border-b border-hairline shadow-sm">
 <div className="max-w-6xl mx-auto flex flex-col md:flex-row md:items-end justify-between gap-xl">
 <div className="max-w-2xl flex items-center gap-md">
 <div className="w-14 h-14 bg-surface-soft rounded-circle flex items-center justify-center shrink-0 border border-hairline">
 <HelpCircle className="w-7 h-7 text-ink-deep" />
 </div>
 <div>
 <h1 className="text-heading-lg font-bold text-ink-deep mb-1">Q&A</h1>
 <p className="text-subtitle-md text-ink">Ask questions and share knowledge</p>
 </div>
 </div>
 <div className="flex gap-sm w-full md:w-auto">
 <button
 onClick={() => setShowAskModal(true)}
 className="button-buy-cta flex-1 md:flex-none"
 >
 Ask a Question
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
 placeholder="Search questions..."
 className="w-full pl-12 pr-4 h-11 bg-surface-soft border border-hairline rounded-full text-[15px] focus:outline-none focus:border-primary focus:bg-canvas transition-all text-ink-deep placeholder:text-slate shadow-sm"
 />
 </div>
 
 <div className="flex flex-col sm:flex-row gap-2 w-full md:w-auto">
 <div className="relative w-full sm:w-auto group">
 <Hash className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-steel group-focus-within:text-primary transition-colors" />
 <input
 type="text"
 value={tagFilter}
 onChange={(e) => setTagFilter(e.target.value)}
 placeholder="Filter tag..."
 className="w-full pl-9 pr-4 h-[40px] bg-surface-soft border border-hairline rounded-full text-body-sm focus:outline-none focus:border-2 focus:border-fb-blue focus:bg-canvas transition-all text-ink placeholder:text-steel sm:w-32"
 />
 </div>

 <div className="flex items-center gap-2 w-full sm:w-auto bg-surface-soft rounded-lg p-xs border border-hairline shrink-0">
 <Filter className="w-4 h-4 text-steel ml-2" />
 <select 
 value={sortOption} 
 onChange={(e) => setSortOption(e.target.value)}
 className="text-body-sm-bold text-ink bg-transparent px-2 py-1 focus:outline-none appearance-none cursor-pointer"
 >
 <option value="newest">Newest</option>
 <option value="votes">Top Votes</option>
 <option value="unanswered">Unanswered</option>
 </select>
 </div>
 </div>
 </div>

 <div className="space-y-md">
 {questions === undefined && (
 <div className="space-y-md">
 {[...Array(4)].map((_, i) => <QuestionCardSkeleton key={i} />)}
 </div>
 )}
 
 {questions && questions.length > 0 && (
 <div className="text-caption-bold text-steel uppercase tracking-wide">
 {questions.length} {questions.length === 1 ? 'Question' : 'Questions'}
 </div>
 )}
 
 <div className="space-y-md">
 {questions?.map((question: any) => (
 <QuestionCard key={question._id} question={question as any} />
 ))}
 </div>
 
 {questions?.length === 0 && (
 <div className="text-center py-section bg-surface-soft rounded-xxxl border border-hairline-soft">
 <HelpCircle className="w-16 h-16 text-steel/50 mx-auto mb-md" />
 <h3 className="text-heading-lg text-ink-deep mb-sm">No questions found</h3>
 <p className="text-body-md text-steel max-w-sm mx-auto mb-xl">
 Try adjusting your search filters or be the first to ask!
 </p>
 </div>
 )}
 </div>
 </div>
 </section>

 {showAskModal && (
 <AskQuestionModal onClose={() => setShowAskModal(false)} />
 )}
 </div>
 );
}

