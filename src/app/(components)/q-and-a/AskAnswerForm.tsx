'use client';

import { useState } from 'react';
import { useMutation } from 'convex/react';
import { api } from '@/convex/_generated/api';
import type { Id } from '@/convex/_generated/dataModel';
import { Send, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

type Props = {
    questionId: Id<'questions'>;
};

export function AskAnswerForm({ questionId }: Props) {
    const [content, setContent] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const answerQuestion = useMutation(api.questions.answerQuestion);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        const trimmedContent = content.trim();
        if (trimmedContent === '') {
            toast.error("Answer cannot be empty.");
            return;
        }

        setIsSubmitting(true);
        try {
            await answerQuestion({ questionId, content: trimmedContent });
            setContent('');
            toast.success("Answer posted successfully!");
        } catch (error) {
            toast.error("Failed to post answer.", { description: (error as Error).message });
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="p-4 border rounded-lg bg-card mt-8">
            <h3 className="font-bold text-lg mb-4">Your Answer</h3>
            <textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="Type your answer here..."
                className="w-full px-3 py-2 text-sm bg-muted/50 rounded-md focus:outline-none focus:ring-1 focus:ring-primary resize-none"
                rows={5}
                disabled={isSubmitting}
            />
            <div className="flex justify-end mt-4">
                <button
                    type="submit"
                    disabled={isSubmitting || content.trim() === ''}
                    className="h-10 py-2 px-4 btn-press bg-primary text-primary-foreground hover:bg-primary/90 rounded-md text-sm font-semibold flex items-center disabled:opacity-50"
                >
                    {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Post Answer
                </button>
            </div>
        </form>
    );
}
