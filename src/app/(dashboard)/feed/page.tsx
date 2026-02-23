import React, { Suspense } from 'react';
import { FeedSkeleton } from '../../(components)/feed/skeletons';
import { Feed } from '../../(components)/feed/Feed';
import { FeedRightSidebar } from '../../(components)/feed/FeedRightSidebar';

export const dynamic = 'force-dynamic';

export default function FeedPage() {
  return (
    <div className="grid grid-cols-12 gap-8 px-4 sm:px-6 lg:px-8 py-8">
      {/* Main Feed Content */}
      <div className="col-span-12 lg:col-span-8 xl:col-span-6 xl:col-start-4">
        <Suspense fallback={<FeedSkeleton />}>
          <Feed />
        </Suspense>
      </div>

      {/* Right Sidebar */}
      <aside className="hidden xl:block xl:col-span-3">
        <FeedRightSidebar />
      </aside>
    </div>
  );
}
