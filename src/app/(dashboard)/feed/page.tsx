'use client';

import React, { Suspense } from 'react';
import { FeedSkeleton } from '@/app/(components)/feed/skeletons';
import { Feed } from '@/app/(components)/feed/Feed';

export default function FeedPage() {
  return (
    <div className="w-full min-h-screen bg-canvas">
      <Suspense fallback={<FeedSkeleton />}>
        <Feed />
      </Suspense>
    </div>
  );
}
