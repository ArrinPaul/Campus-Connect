'use client';

import { Suspense, useEffect, useRef } from 'react';
import { useQuery, useMutation, useConvexAuth } from 'convex/react';
import { api } from '@/convex/_generated/api';
import type { Id } from '@/convex/_generated/dataModel';
import { notFound } from 'next/navigation';
import { ArrowLeft, User as UserIcon, MessageCircle, Eye, ArrowUp, ArrowDown, CheckCircle, Loader2, Calendar, BookOpen } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import { formatDistanceToNow } from 'date-fns';
import { AnswerCard } from '../../../(components)/q-and-a/AnswerCard';
import { AskAnswerForm } from '../../../(components)/q-and-a/AskAnswerForm';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

type PageProps = {
    params: {
        id: Id<'questions'>;
    };
};

const QuestionDetailPageSkeleton = () => (
    <div className="max-w-4xl mx-auto py-8 px-4">
        <div className="h-10 w-48 bg-muted/50 rounded-md animate-pulse mb-6" />
        <div className="bg-card border rounded-lg p-6 space-y-4">
            <div className="h-8 w-3/4 bg-muted/50 rounded-md animate-pulse" />
            <div className="h-4 w-full bg-muted/50 rounded-md animate-pulse" />
            <div className="h-4 w-2/3 bg-muted/50 rounded-md animate-pulse" />
            <div className="h-10 w-24 ml-auto bg-muted/50 rounded-md animate-pulse" />
        </div>
        <div className="h-32 w-full bg-muted/50 rounded-lg animate-pulse mt-8" />
    </div>
);

function QuestionDetailPageContent({ questionId }: { questionId: Id<'questions'> }) {
    const { isAuthenticated } = useConvexAuth();
    const question = useQuery(api.questions.getQuestion, { questionId });
    const incrementViewCount = useMutation(api.questions.incrementViewCount);
    const vote = useMutation(api.questions.vote);
    const acceptAnswer = useMutation(api.questions.acceptAnswer);
    const currentUser = useQuery(api.users.getCurrentUser, isAuthenticated ? {} : 'skip');
    const hasIncrementedRef = useRef(false);

    useEffect(() => {
        if (question && !hasIncrementedRef.current) {
            hasIncrementedRef.current = true;
            incrementViewCount({ questionId }).catch(() => {});
        }
    }, [questionId, question, incrementViewCount]);

    const handleVote = async (targetId: Id<'questions'> | Id<'answers'>, targetType: 'question' | 'answer', voteType: 'up' | 'down') => {
        try {
            await vote({ targetId, targetType, voteType });
        } catch (error) {
            toast.error("Failed to vote.", { description: (error as Error).message });
        }
    };

    const handleAcceptAnswer = async (answerId: Id<'answers'>) => {
        try {
            await acceptAnswer({ answerId });
            toast.success("Answer accepted!");
        } catch (error) {
            toast.error("Failed to accept answer.", { description: (error as Error).message });
        }
    };

    if (question === undefined) {
        return <QuestionDetailPageSkeleton />;
    }

    if (question === null) {
        notFound();
    }

    const askerName = question.asker?.name || 'Anonymous';
    const askerAvatar = question.asker?.profilePicture;
    const isQuestionOwner = currentUser?._id === question.askedBy;

    return (
        <div className="max-w-4xl mx-auto py-8 px-4">
             <Link href="/q-and-a" className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-4">
                <ArrowLeft className="h-4 w-4" />
                Back to all questions
            </Link>

            <div className="bg-card border rounded-lg p-6">
                <h1 className="text-3xl font-bold text-primary mb-2">{question.title}</h1>
                
                <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-sm text-muted-foreground mb-4">
                    <div className="flex items-center gap-1.5">
                        {askerAvatar ? (
                            <Image src={askerAvatar} alt={askerName} width={16} height={16} className="h-4 w-4 rounded-full object-cover" />
                        ) : (
                            <UserIcon className="h-4 w-4" />
                        )}
                        <p>{askerName}</p>
                    </div>
                    <div className="flex items-center gap-1.5"><Calendar className="h-4 w-4" /> Asked {formatDistanceToNow(new Date(question.createdAt), { addSuffix: true })}</div>
                    <div className="flex items-center gap-1.5"><Eye className="h-4 w-4" /> {question.viewCount} views</div>
                    {question.course && <div className="flex items-center gap-1.5"><BookOpen className="h-4 w-4" /> {question.course}</div>}
                </div>

                <div className="prose prose-sm dark:prose-invert max-w-none mb-6">
                    <p className="whitespace-pre-wrap">{question.content}</p>
                </div>

                {question.tags && question.tags.length > 0 && (
                    <div className="flex flex-wrap gap-2 mt-4">
                        {question.tags.map(tag => (
                            <Link href={`/hashtag/${tag}`} key={tag} className="px-3 py-1 rounded-full text-sm font-medium bg-muted hover:bg-muted/80">
                                #{tag}
                            </Link>
                        ))}
                    </div>
                )}

                <div className="flex justify-between items-center mt-6 border-t pt-4">
                    <div className="flex items-center gap-3">
                        {isAuthenticated ? (
                          <>
                            <button 
                                onClick={() => handleVote(question._id, 'question', 'up')} 
                                className={cn("p-2 rounded-full hover:bg-muted/50 flex items-center gap-1", { "text-primary": question.viewerVotes?.[question._id] === 'up' })}
                                title="Upvote"
                            >
                                <ArrowUp className="h-5 w-5" /> {question.upvotes}
                            </button>
                            <button 
                                onClick={() => handleVote(question._id, 'question', 'down')} 
                                className={cn("p-2 rounded-full hover:bg-muted/50 flex items-center gap-1", { "text-red-500": question.viewerVotes?.[question._id] === 'down' })}
                                title="Downvote"
                            >
                                <ArrowDown className="h-5 w-5" /> {question.downvotes}
                            </button>
                          </>
                        ) : (
                            <span className="text-sm text-muted-foreground">Sign in to vote</span>
                        )}
                    </div>
                    <div className="flex items-center gap-2 text-muted-foreground">
                        <MessageCircle className="h-5 w-5" />
                        <span>{question.answerCount} Answers</span>
                    </div>
                </div>
            </div>

            <h2 className="text-2xl font-bold mt-10 mb-6">Answers ({question.answers?.length || 0})</h2>
            <div className="space-y-4">
                {question.answers?.map(answer => (
                    <AnswerCard 
                        key={answer._id} 
                        answer={answer as any} 
                        isQuestionOwner={isQuestionOwner} 
                        onAccept={() => handleAcceptAnswer(answer._id)} 
                    />
                ))}
                {question.answers?.length === 0 && (
                    <div className="text-center py-8 text-muted-foreground">
                        <p className="text-lg">No answers yet.</p>
                        <p className="text-sm">Be the first to provide an answer!</p>
                    </div>
                )}
            </div>
            
            {isAuthenticated ? (
                <AskAnswerForm questionId={question._id} />
            ) : (
                <p className="text-center text-muted-foreground mt-8 py-4 border rounded-lg bg-muted/30">Sign in to answer this question</p>
            )}
        </div>
    );
}

export default function QuestionDetailPage({ params }: PageProps) {
    return (
        <Suspense fallback={<QuestionDetailPageSkeleton />}>
            <QuestionDetailPageContent questionId={params.id} />
        </Suspense>
    );
}
