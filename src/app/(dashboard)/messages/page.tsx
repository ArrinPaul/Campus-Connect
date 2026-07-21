'use client';

import { Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { MessagesSkeleton } from '../../(components)/messages/skeletons';
import { ConversationList } from '../../(components)/messages/ConversationList';
import { ChatWindow } from '../../(components)/messages/ChatWindow';
import type { Id } from '@/lib/api';
import { MessageSquare } from 'lucide-react';

function MessagesPageContent() {
  const searchParams = useSearchParams();
  const selectedConversationId = searchParams.get('c');

  return (
    <div className="flex h-[calc(100vh-61px)] md:h-screen w-full min-w-0 bg-background overflow-hidden">
      {/* Desktop: Two-column expanded layout */}
      <div className="hidden md:flex flex-col w-72 xl:w-80 border-r border-border bg-card/60 flex-shrink-0 h-full">
        <ConversationList selectedConversationId={selectedConversationId as Id<'conversations'> | null} />
      </div>

      <div className="hidden md:flex flex-1 w-full min-w-0 h-full">
        {selectedConversationId ? (
          <ChatWindow key={selectedConversationId} conversationId={selectedConversationId as Id<'conversations'>} />
        ) : (
          <div className="flex flex-col h-full w-full items-center justify-center text-center p-8 bg-background">
            <div className="rounded-full bg-primary/10 p-6 mb-4 animate-bounce duration-1000">
              <MessageSquare className="text-primary h-12 w-12" />
            </div>
            <h2 className="text-2xl font-bold tracking-tight text-foreground">Select a Conversation</h2>
            <p className="text-muted-foreground mt-2 max-w-md text-sm leading-relaxed">
              Choose a contact from your inbox list to start messaging, share files, upload project images, or send emojis.
            </p>
          </div>
        )}
      </div>

      {/* Mobile: Full screen list or active chat window */}
      <div className="md:hidden w-full h-full bg-background">
        {selectedConversationId ? (
          <ChatWindow key={selectedConversationId} conversationId={selectedConversationId as Id<'conversations'>} />
        ) : (
          <ConversationList selectedConversationId={null} />
        )}
      </div>
    </div>
  );
}

export default function MessagesPage() {
  return (
    <Suspense fallback={<MessagesSkeleton />}>
      <MessagesPageContent />
    </Suspense>
  );
}
