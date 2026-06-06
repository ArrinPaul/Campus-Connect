import React, { Suspense } from 'react';
import { FeedSkeleton } from '../../(components)/feed/skeletons';
import { Feed } from '../../(components)/feed/Feed';

export const dynamic = 'force-dynamic';

export default function FeedPage() {
  return (
    <div className="w-full min-h-screen bg-canvas">
      <Suspense fallback={<FeedSkeleton />}>
        <Feed />
      </Suspense>
    </div>
  );
}
