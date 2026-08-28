'use client';

import React from 'react';
import Link from 'next/link';
import { Heart, Send, Search } from 'lucide-react';
import { useUser } from '@/lib/auth/client';
import { useQuery } from '@/lib/api';
import { api } from '@/lib/api';

export function MobileTopBar() {
  const { isSignedIn } = useUser();

  const unreadNotifications = useQuery(
    api.notifications.getUnreadCount,
    isSignedIn ? {} : 'skip'
  );

  const totalUnreadMessages = useQuery(
    api.conversations.getTotalUnreadCount,
    isSignedIn ? {} : 'skip'
  );

  return (
    <header className="relative flex items-center justify-between h-[48px] px-3.5 bg-background/95 dark:bg-black/95 backdrop-blur-xl border-b border-border sticky top-0 z-40">
      {/* Left Action: Search */}
      <div className="flex items-center gap-2 z-10">
        <Link
          href="/search"
          className="h-9 w-9 flex items-center justify-center rounded-full text-foreground hover:bg-muted transition-colors active:scale-90"
          aria-label="Search"
        >
          <Search className="h-[22px] w-[22px] stroke-[1.8]" />
        </Link>
      </div>

      {/* Middle Brand: Pure typography Campus Connect centered in Instagram style */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        <Link
          href="/feed"
          className="pointer-events-auto flex items-center active:scale-95 transition-transform"
        >
          <span className="font-bold text-[20px] tracking-tight text-foreground font-sans">
            Campus Connect
          </span>
        </Link>
      </div>

      {/* Right Actions: Activity Heart & Direct Messages */}
      <div className="flex items-center gap-1 z-10">
        {isSignedIn ? (
          <>
            {/* Activity / Notifications Heart */}
            <Link
              href="/notifications"
              className="relative h-9 w-9 flex items-center justify-center rounded-full text-foreground hover:bg-muted transition-colors active:scale-90"
              aria-label="Notifications"
            >
              <Heart className="h-[22px] w-[22px] stroke-[1.8]" />
              {typeof unreadNotifications === 'number' && unreadNotifications > 0 && (
                <span className="absolute top-1.5 right-1.5 flex h-2 w-2 rounded-full bg-[#ED4956] ring-1.5 ring-background" />
              )}
            </Link>

            {/* Direct Messages Paper-plane */}
            <Link
              href="/messages"
              className="relative h-9 w-9 flex items-center justify-center rounded-full text-foreground hover:bg-muted transition-colors active:scale-90"
              aria-label="Messages"
            >
              <Send className="h-[20px] w-[20px] stroke-[1.8] -rotate-12 translate-y-[-1px]" />
              {typeof totalUnreadMessages === 'number' && totalUnreadMessages > 0 && (
                <span className="absolute top-1 right-1 flex h-4 min-w-[15px] items-center justify-center rounded-full bg-[#ED4956] px-1 text-[9px] font-bold text-white shadow-xs ring-1.5 ring-background">
                  {totalUnreadMessages > 99 ? '99+' : totalUnreadMessages}
                </span>
              )}
            </Link>
          </>
        ) : (
          <Link
            href="/sign-in"
            className="text-xs font-semibold px-3 py-1.5 rounded-lg bg-primary text-on-primary hover:bg-primary-deep transition-colors"
          >
            Log In
          </Link>
        )}
      </div>
    </header>
  );
}
