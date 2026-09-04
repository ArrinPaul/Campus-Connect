'use client';

import { Suspense, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import type { Id } from '@/lib/api';
import { ChatArea } from '@/components/messages/ChatArea';
import { MessagesSkeleton } from '../../../(components)/messages/skeletons';

type Props = {
 params: {
 id: Id<'conversations'>;
 };
};

function MobileChatPageContent({ conversationId }: { conversationId: Id<'conversations'> }) {
 const router = useRouter();
 // 48px matches MobileTopBar's actual sticky height (MobileTopBar.tsx
 // h-[48px]) — was 61px, which didn't match anything real. The shared
 // shell no longer adds its own padding or a fixed bottom nav on this
 // route (see main-layout.tsx isMobileConversationView), so this is the
 // only offset left to account for.
 return (
 <div className="h-[calc(100vh-48px)]">
 <ChatArea conversationId={conversationId} onBack={() => router.push('/messages')} />
 </div>
 );
}

// On desktop, this page should not be accessible directly, we redirect to the main messages page
// which shows the two-column layout. This page is only for the mobile view.
function DesktopRedirect() {
 const { push } = useRouter();
 useEffect(() => {
 push('/messages');
 }, [push]);
 return <MessagesSkeleton />;
}


export default function MobileChatPage({ params }: Props) {
 return (
 <>
 <div className="md:hidden h-full">
 <Suspense fallback={<MessagesSkeleton />}>
 <MobileChatPageContent conversationId={params.id} />
 </Suspense>
 </div>
 <div className="hidden md:block">
 <DesktopRedirect />
 </div>
 </>
 );
}
