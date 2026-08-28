"use client";

import { useState, useEffect } from "react";
import { StoryRow } from "@/components/stories/StoryRow";
import { PostComposer } from "@/components/posts/PostComposer";
import { FeedContainer } from "@/components/feed/FeedContainer";
import { FeedRightSidebar } from "./FeedRightSidebar";
import { createPortal } from "react-dom";
import { cn } from "@/lib/utils";

type FeedType = "following" | "for-you" | "trending";

const TABS: { key: FeedType; label: string }[] = [
  { key: "for-you", label: "For You" },
  { key: "following", label: "Following" },
  { key: "trending", label: "Trending" },
];

export function Feed() {
  const [activeTab, setActiveTab] = useState<FeedType>("for-you");
  const [rightSidebarNode, setRightSidebarNode] = useState<HTMLElement | null>(null);

  useEffect(() => {
    setRightSidebarNode(document.getElementById("right-sidebar-portal"));
  }, []);

  return (
    <div className="w-full flex flex-col">
      {rightSidebarNode && createPortal(<FeedRightSidebar />, rightSidebarNode)}
      
      {/* Stories */}
      <div className="mb-4">
        <StoryRow />
      </div>

      {/* Composer */}
      <div className="mb-2">
        <PostComposer />
      </div>

      {/* Feed Filters */}
      <div className="w-full mb-4 flex items-center justify-between border-b border-border pb-2">
        <div className="flex items-center gap-1">
          {TABS.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={cn(
                "px-4 py-2 rounded-lg text-[15px] font-semibold transition-colors",
                activeTab === tab.key 
                  ? "bg-primary/10 text-primary" 
                  : "text-muted-foreground hover:bg-accent hover:text-foreground"
              )}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Main Feed */}
      <div className="w-full">
        <FeedContainer feedType={activeTab} />
      </div>
    </div>
  );
}
