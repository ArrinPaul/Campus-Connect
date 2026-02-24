'use client';

import { useState } from 'react';
import { CreatePost } from './CreatePost';
import { StoryRow } from '@/components/stories/StoryRow';
import { FeedContainer } from '@/components/feed/FeedContainer';

type FeedType = 'following' | 'for-you' | 'trending';

const TABS: { key: FeedType; label: string }[] = [
  { key: 'following', label: 'Following' },
  { key: 'for-you', label: 'For You' },
  { key: 'trending', label: 'Trending' },
];

export function Feed() {
  const [activeTab, setActiveTab] = useState<FeedType>('for-you');

  return (
    <div className="space-y-4">
      <StoryRow />
      <CreatePost />

      {/* Feed Tabs */}
      <div className="flex items-center gap-1 border-b border-zinc-800 pb-0">
        {TABS.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`px-4 py-2.5 text-sm font-medium transition-colors relative ${
              activeTab === tab.key
                ? 'text-white'
                : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            {tab.label}
            {activeTab === tab.key && (
              <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-500 rounded-full" />
            )}
          </button>
        ))}
      </div>

      {/* Virtualized Feed with Infinite Scroll */}
      <FeedContainer feedType={activeTab} />
    </div>
  );
}
