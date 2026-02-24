'use client';

import type { Doc } from '@/convex/_generated/dataModel';
import { User as UserIcon, ArrowUp, ArrowDown, CheckCircle } from 'lucide-react';
import Image from 'next/image';
import { formatDistanceToNow } from 'date-fns';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { useMutation } from 'convex/react';
import { api } from '@/convex/_generated/api';

type Answer = Doc<'answers'> & {
    answerer: {
        name: string | null;
        profilePicture: string | null;
    } | null;
    score: number;
    viewerVotes?: Record<string, 'up' | 'down'>;
    mediaUrls?: string[];
};

type Props = {
    answer: Answer;
    isQuestionOwner: boolean;
    onAccept: () => void;
};

export function AnswerCard({ answer, isQuestionOwner, onAccept }: Props) {
    const answererName = answer.answerer?.name || 'Anonymous';
    const answererAvatar = answer.answerer?.profilePicture;
    const vote = useMutation(api.questions.vote);

    const handleVote = async (voteType: 'up' | 'down') => {
        try {
            await vote({ targetId: answer._id, targetType: 'answer', voteType });
        } catch (error) {
            toast.error("Failed to vote.", { description: (error as Error).message });
        }
    };

    return (
        <div className={cn("p-4 border rounded-lg bg-card", {
            "border-green-500/50 bg-green-500/5": answer.isAccepted,
        })}>
            <div className="flex items-start gap-3">
                <div className="flex flex-col items-center gap-1 flex-shrink-0">
                    <button 
                        onClick={() => handleVote('up')} 
                        className={cn("p-1 rounded-full hover:bg-muted/50", { "text-primary": answer.viewerVotes?.[answer._id] === 'up' })}
                        title="Upvote"
                    >
                        <ArrowUp className="h-5 w-5" />
                    </button>
                    <span className="font-bold text-lg">{answer.score}</span>
                    <button 
                        onClick={() => handleVote('down')} 
                        className={cn("p-1 rounded-full hover:bg-muted/50", { "text-red-500": answer.viewerVotes?.[answer._id] === 'down' })}
                        title="Downvote"
                    >
                        <ArrowDown className="h-5 w-5" />
                    </button>
                </div>
                <div className="flex-1">
                    <p className="text-sm text-muted-foreground mb-2 whitespace-pre-wrap">{answer.content}</p>
                    {answer.mediaUrls && answer.mediaUrls.length > 0 && (
                        <div className="flex flex-wrap gap-2 mb-3">
                            {answer.mediaUrls.map((url, index) => (
                                <a key={index} href={url} target="_blank" rel="noopener noreferrer">
                                    <Image
                                        src={url}
                                        alt={`Answer attachment ${index + 1}`}
                                        width={200}
                                        height={200}
                                        className="rounded-lg border object-cover max-h-48 hover:opacity-90 transition-opacity"
                                    />
                                </a>
                            ))}
                        </div>
                    )}
                    <div className="flex items-center justify-between text-xs text-muted-foreground mt-2">
                        <div className="flex items-center gap-1">
                            {answererAvatar ? (
                                <Image src={answererAvatar} alt={answererName} width={16} height={16} className="h-4 w-4 rounded-full object-cover" />
                            ) : (
                                <UserIcon className="h-3.5 w-3.5" />
                            )}
                            <p>{answererName}</p>
                            <span className="mx-1">•</span>
                            <p>{formatDistanceToNow(new Date(answer.createdAt), { addSuffix: true })}</p>
                        </div>
                        <div className="flex items-center gap-2">
                             {answer.isAccepted && (
                                <span className="inline-flex items-center gap-1 text-green-500 font-semibold">
                                    <CheckCircle className="h-4 w-4" /> Accepted
                                </span>
                            )}
                            {isQuestionOwner && !answer.isAccepted && (
                                <button onClick={onAccept} className="text-primary hover:underline flex items-center gap-1">
                                    <CheckCircle className="h-4 w-4" /> Accept
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
