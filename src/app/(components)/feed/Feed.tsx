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

      {/* Feed Tabs - Meta Pill Nav */}
      <div className="w-full sticky top-[64px] z-30 bg-canvas/90 backdrop-blur-md border-b border-hairline py-md">
        <div className="max-w-2xl mx-auto flex items-center justify-center gap-sm">
          {TABS.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={activeTab === tab.key ? "button-pill-tab-active" : "button-pill-tab"}
            >
              {tab.label}
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
