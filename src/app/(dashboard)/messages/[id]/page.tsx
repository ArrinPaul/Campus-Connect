'use client';

import { Suspense, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import type { Id } from '@/convex/_generated/dataModel';
import { ChatWindow } from '../../../(components)/messages/ChatWindow';
import { MessagesSkeleton } from '../../../(components)/messages/skeletons';

type Props = {
    params: {
        id: Id<'conversations'>;
    };
};

function MobileChatPageContent({ conversationId }: { conversationId: Id<'conversations'> }) {
    return (
        <div className="h-[calc(100vh-61px)]">
            <ChatWindow conversationId={conversationId} />
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
