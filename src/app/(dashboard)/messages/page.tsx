'use client';

import { Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { MessagesSkeleton } from '../../(components)/messages/skeletons';
import { ConversationList } from '../../(components)/messages/ConversationList';
import { ChatArea } from '@/components/messages/ChatArea';
import type { Id } from '@/lib/api';
import { MessageSquare } from 'lucide-react';

function MessagesPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const selectedConversationId = searchParams.get('c');
  const handleBack = () => router.push('/messages');

  return (
    <div className="flex h-[calc(100vh-61px)] md:h-[calc(100vh-56px)] w-full min-w-0 bg-canvas overflow-hidden">
      {/* Desktop: Two-column expanded layout */}
      <div className="hidden md:flex flex-col w-72 xl:w-80 border-r border-border bg-card flex-shrink-0 h-full shadow-sm z-10">
        <ConversationList selectedConversationId={selectedConversationId as Id<'conversations'> | null} />
      </div>

      <div className="hidden md:flex flex-1 w-full min-w-0 h-full">
        {selectedConversationId ? (
          <ChatArea key={selectedConversationId} conversationId={selectedConversationId as Id<'conversations'>} onBack={handleBack} />
        ) : (
          <div className="flex flex-col h-full w-full items-center justify-center text-center p-8 bg-canvas">
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

      {/* Mobile: full-screen conversation list */}
      {!selectedConversationId && (
        <div className="md:hidden w-full h-full bg-background">
          <ConversationList selectedConversationId={null} />
        </div>
      )}

      {/* Mobile: active chat, as a true full-viewport overlay. ChatArea
          renders its own header/composer and expects the full screen — the
          shared shell's bottom padding and fixed bottom tab bar (both sized
          for scrollable list-style pages) would otherwise fight it for
          space and partially cover the composer. A fixed overlay sidesteps
          that entirely instead of trying to keep two independent height
          calculations in sync with the shell. z-[60] sits above the shell's
          sticky top bar (z-40) and fixed bottom nav (z-50). */}
      {selectedConversationId && (
        <div className="md:hidden fixed inset-0 z-[60] bg-background">
          <ChatArea key={selectedConversationId} conversationId={selectedConversationId as Id<'conversations'>} onBack={handleBack} />
        </div>
      )}
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

