import React, { Suspense } from 'react';
import { FeedSkeleton } from '../../(components)/feed/skeletons';
import { Feed } from '../../(components)/feed/Feed'; 

export const dynamic = 'force-dynamic';

export default function FeedPage() {
  return (
    <div className="grid grid-cols-12 gap-8 px-4 sm:px-6 lg:px-8 py-8">
      {/* Main Feed Content */}
      <div className="col-span-12 lg:col-span-8 xl:col-span-6 xl:col-start-4">
        <Suspense fallback={<FeedSkeleton />}>
          {/* @ts-expect-error Server Component */}
          <Feed />
        </Suspense>
      </div>

      {/* Right Sidebar */}
      <aside className="hidden xl:block xl:col-span-3">
        <div className="sticky top-8 space-y-6">
          <div className="rounded-lg border bg-card p-4">
            <h3 className="font-bold text-lg">Trending Topics</h3>
            <div className="mt-4 space-y-3">
                <div className="font-medium text-sm">#AcademicExcellence</div>
                <div className="font-medium text-sm">#ResearchLife</div>
                <div className="font-medium text-sm">#AIinEducation</div>
                <div className="font-medium text-sm">#FutureofWork</div>
            </div>
          </div>
          <div className="rounded-lg border bg-card p-4">
            <h3 className="font-bold text-lg">Who to Follow</h3>
             <div className="mt-4 space-y-4">
                <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-full bg-muted"></div>
                    <div className="flex-1">
                        <div className="font-bold text-sm">Dr. Emily Carter</div>
                        <div className="text-xs text-muted-foreground">Quantum Physics Prof.</div>
                    </div>
                </div>
                 <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-full bg-muted"></div>
                    <div className="flex-1">
                        <div className="font-bold text-sm">Campus Daily News</div>
                        <div className="text-xs text-muted-foreground">Official Updates</div>
                    </div>
                </div>
            </div>
          </div>
        </div>
      </aside>
    </div>
  );
}
