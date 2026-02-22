'use client';

import { Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { MessagesSkeleton } from '../../(components)/messages/skeletons';
import { ConversationList } from '../../(components)/messages/ConversationList';
import { ChatWindow } from '../../(components)/messages/ChatWindow';
import type { Id } from '@/convex/_generated/dataModel';
import { MessageSquare } from 'lucide-react';

function MessagesPageContent() {
    const searchParams = useSearchParams();
    const selectedConversationId = searchParams.get('c');

    return (
        <div className="flex h-[calc(100vh-61px)] md:h-screen">
            {/* Desktop: Two-column layout */}
            <div className="hidden md:flex flex-col w-full max-w-xs border-r bg-card">
                <ConversationList selectedConversationId={selectedConversationId as Id<'conversations'> | null} />
            </div>
            <div className="hidden md:flex flex-1">
                {selectedConversationId ? (
                    <ChatWindow key={selectedConversationId} conversationId={selectedConversationId as Id<'conversations'>} />
                ) : (
                    <div className="flex flex-col h-full items-center justify-center text-center p-8">
                        <div className="rounded-full bg-primary/10 p-4">
                             <MessageSquare className="text-primary h-10 w-10" />
                        </div>
                        <h2 className="text-xl font-semibold mt-4">Select a conversation</h2>
                        <p className="text-muted-foreground mt-2 max-w-sm">
                            Choose from your existing conversations, or start a new one to begin chatting.
                        </p>
                    </div>
                )}
            </div>

            {/* Mobile: Only show conversation list */}
            <div className="md:hidden w-full bg-card">
                 <ConversationList selectedConversationId={null} />
            </div>
        </div>
    );
}

export default function MessagesPage() {
    // The top-level Suspense for the whole page
    return (
        <Suspense fallback={<MessagesSkeleton />}>
            <MessagesPageContent />
        </Suspense>
    );
}
