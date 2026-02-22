'use client';

import Link from 'next/link';
import type { Doc } from '@/convex/_generated/dataModel';
import { MessageCircle, Hash, Eye, ArrowUp, ArrowDown, User as UserIcon } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

type Question = Doc<'questions'> & {
    asker: {
        name: string | null;
        profilePicture: string | null;
    } | null;
    score: number; // upvotes - downvotes
};

type Props = {
    question: Question;
};

export function QuestionCard({ question }: Props) {
    const askerName = question.asker?.name || 'Anonymous';
    const askerAvatar = question.asker?.profilePicture;

    return (
        <Link href={`/q-and-a/${question._id}`} className="block p-4 border rounded-lg bg-card hover:bg-muted/50 transition-colors">
            <h3 className="font-bold text-lg text-primary line-clamp-2">{question.title}</h3>
            <p className="text-sm text-muted-foreground mt-1 line-clamp-2">{question.content}</p>

            <div className="flex flex-wrap items-center justify-between mt-3 text-xs text-muted-foreground">
                <div className="flex items-center gap-1">
                    {askerAvatar ? (
                         <img src={askerAvatar} alt={askerName} className="h-4 w-4 rounded-full object-cover" />
                    ) : (
                        <UserIcon className="h-3.5 w-3.5" />
                    )}
                    <p>{askerName}</p>
                    <span className="mx-1">•</span>
                    <p>{formatDistanceToNow(new Date(question.createdAt), { addSuffix: true })}</p>
                </div>
                <div className="flex items-center gap-3">
                     <div className="flex items-center gap-1">
                        <ArrowUp className="h-3.5 w-3.5" /> {question.upvotes}
                    </div>
                    <div className="flex items-center gap-1">
                        <ArrowDown className="h-3.5 w-3.5" /> {question.downvotes}
                    </div>
                    <div className="flex items-center gap-1">
                        <MessageCircle className="h-3.5 w-3.5" /> {question.answerCount}
                    </div>
                    <div className="flex items-center gap-1">
                        <Eye className="h-3.5 w-3.5" /> {question.viewCount}
                    </div>
                </div>
            </div>
            {question.tags && question.tags.length > 0 && (
                <div className="flex flex-wrap gap-1 mt-3">
                    {question.tags.map(tag => (
                        <span key={tag} className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-muted text-xs text-muted-foreground">
                            <Hash className="h-3 w-3" /> {tag}
                        </span>
                    ))}
                </div>
            )}
        </Link>
    );
}
