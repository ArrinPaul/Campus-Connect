'use client';

import { useState } from 'react';
import { CreatePost } from './CreatePost';
import { StoryRow } from '@/components/stories/StoryRow';
import { FeedContainer } from '@/components/feed/FeedContainer';
import { Section } from '@/components/ui/Section';
import { cn } from '@/lib/utils';
import { FeedRightSidebar } from './FeedRightSidebar';
import { createPortal } from 'react-dom';
import { useEffect } from 'react';

type FeedType = 'following' | 'for-you' | 'trending';

const TABS: { key: FeedType; label: string }[] = [
  { key: 'following', label: 'Following' },
  { key: 'for-you', label: 'For You' },
  { key: 'trending', label: 'Trending' },
];

export function Feed() {
  const [activeTab, setActiveTab] = useState<FeedType>('for-you');
  const [rightSidebarNode, setRightSidebarNode] = useState<HTMLElement | null>(null);

  useEffect(() => {
    setRightSidebarNode(document.getElementById('right-sidebar-portal'));
  }, []);

  return (
    <div className="w-full flex flex-col items-center">
      {rightSidebarNode && createPortal(<FeedRightSidebar />, rightSidebarNode)}
      {/* Top Stories/Create Area */}
      <div className="w-full max-w-2xl px-4 md:px-0 mt-md space-y-md">
        <StoryRow />
        <CreatePost />
      </div>

      {/* Feed Tabs - Apple Style */}
      <div className="w-full sticky top-[96px] z-30 glass bg-canvas/80 border-b border-hairline mt-md">
        <div className="max-w-2xl mx-auto flex items-center justify-center gap-xl h-[44px]">
          {TABS.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={cn(
                "relative h-full flex items-center text-caption font-semibold transition-colors btn-press",
                activeTab === tab.key
                  ? "text-primary"
                  : "text-ink-muted-48 hover:text-ink"
              )}
            >
              {tab.label}
              {activeTab === tab.key && (
                <span className="absolute bottom-0 left-0 right-0 h-[2px] bg-primary rounded-full" />
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Main Feed Content */}
      <div className="w-full">
        <FeedContainer feedType={activeTab} />
      </div>
    </div>
  );
}
