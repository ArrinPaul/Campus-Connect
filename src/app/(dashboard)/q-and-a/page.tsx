'use client';

import { useQuery } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { QuestionCard } from '../../(components)/q-and-a/QuestionCard';
import { AskQuestionModal } from '@/components/q-and-a/AskQuestionModal';
import Link from 'next/link';
import { Search, Plus } from 'lucide-react';
import { useState } from 'react';

const QuestionCardSkeleton = () => <div className="p-4 border rounded-lg bg-card h-48 animate-pulse" />;

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
        <div className="max-w-4xl mx-auto py-8 px-4">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
                <h1 className="text-3xl font-bold">Questions & Answers</h1>
                <div className="flex gap-2">
                    <button
                        onClick={() => setShowAskModal(true)}
                        className="h-10 py-2 px-4 btn-press bg-primary text-primary-foreground hover:bg-primary/90 rounded-md text-sm font-semibold"
                    >
                        Ask a Question
                    </button>
                </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-4 mb-6">
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                    <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="Search questions by title, content, or tags..."
                        className="w-full pl-10 pr-4 py-2.5 text-base bg-muted/50 rounded-full focus:outline-none focus:ring-1 focus:ring-primary"
                    />
                </div>
                <select 
                    value={sortOption} 
                    onChange={(e) => setSortOption(e.target.value)}
                    className="w-full sm:w-auto px-3 py-2 text-base bg-muted/50 rounded-full focus:outline-none focus:ring-1 focus:ring-primary"
                >
                    <option value="newest">Newest</option>
                    <option value="votes">Top Votes</option>
                    <option value="unanswered">Unanswered</option>
                </select>
                 <input
                    type="text"
                    value={tagFilter}
                    onChange={(e) => setTagFilter(e.target.value)}
                    placeholder="Filter by tag..."
                    className="w-full sm:w-auto px-3 py-2 text-base bg-muted/50 rounded-full focus:outline-none focus:ring-1 focus:ring-primary"
                />
            </div>


            <div className="space-y-4">
                 {questions === undefined && (
                    [...Array(5)].map((_, i) => <QuestionCardSkeleton key={i} />)
                )}
                {questions?.map(question => (
                    <QuestionCard key={question._id} question={question as any} />
                ))}
                {questions?.length === 0 && (
                    <div className="text-center py-16">
                        <h3 className="text-lg font-semibold">No questions found</h3>
                        <p className="text-muted-foreground mt-2">
                            Try asking a question or adjusting your filters.
                        </p>
                    </div>
                )}
            </div>

            {showAskModal && (
                <AskQuestionModal onClose={() => setShowAskModal(false)} />
            )}
        </div>
    );
}
