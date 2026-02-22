'use client';

import { useState } from 'react';
import { useMutation } from 'convex/react';
import { api } from '@/convex/_generated/api';
import type { Id } from '@/convex/_generated/dataModel';
import { SendHorizontal, Plus, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

type Props = {
    conversationId: Id<'conversations'>;
};

export function ChatInput({ conversationId }: Props) {
    const [content, setContent] = useState('');
    const sendMessage = useMutation(api.messages.sendMessage);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        const trimmedContent = content.trim();
        if (trimmedContent === '') return;

        setIsSubmitting(true);
        try {
            setContent('');
            await sendMessage({
                conversationId,
                content: trimmedContent,
            });
        } catch (error) {
             toast.error("Failed to send message.");
             setContent(trimmedContent); // Restore content on error
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSubmit(e as any);
        }
    }

    return (
        <form onSubmit={handleSubmit} className="flex items-center gap-2">
            <button type="button" className="p-2 rounded-full hover:bg-muted" title="Attach file">
                <Plus className="h-5 w-5 text-muted-foreground" />
            </button>
            <input
                value={content}
                onChange={(e) => setContent(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Type a message..."
                className="flex-1 px-4 py-2 text-sm bg-muted/50 rounded-full focus:outline-none focus:ring-1 focus:ring-primary"
                disabled={isSubmitting}
            />
            <button
                type="submit"
                disabled={isSubmitting || content.trim() === ''}
                className="p-2 h-9 w-9 flex items-center justify-center rounded-full bg-primary text-primary-foreground disabled:bg-muted disabled:text-muted-foreground btn-press"
                title="Send message"
            >
                {isSubmitting ? (
                    <Loader2 className="h-5 w-5 animate-spin" />
                ) : (
                    <SendHorizontal className="h-5 w-5" />
                )}
            </button>
        </form>
    );
}
