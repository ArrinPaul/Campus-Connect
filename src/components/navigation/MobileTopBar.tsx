'use client';

import React from 'react';
import Link from 'next/link';
import { Bell, MessageSquare, Search } from 'lucide-react';
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
    <header className="relative flex items-center justify-between h-14 px-4 bg-card/90 dark:bg-card/95 backdrop-blur-md border-b border-border/80 sticky top-0 z-40">
      {/* Left Action / Search */}
      <div className="flex items-center gap-2 z-10">
        <Link
          href="/search"
          className="h-9 w-9 flex items-center justify-center rounded-full text-foreground/80 hover:text-foreground hover:bg-muted transition-colors active:scale-95"
          aria-label="Search"
        >
          <Search className="h-5 w-5 stroke-[2.2]" />
        </Link>
      </div>

      {/* Middle Brand: Campus Connect centered like Instagram */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        <Link
          href="/feed"
          className="pointer-events-auto flex items-center gap-2 active:scale-95 transition-transform"
        >
          <div className="h-7 w-7 rounded-lg bg-gradient-to-tr from-primary to-blue-500 flex items-center justify-center text-on-primary font-black text-xs shadow-sm shadow-primary/20">
            CC
          </div>
          <span className="font-bold text-[17px] tracking-tight text-foreground bg-gradient-to-r from-foreground via-foreground to-foreground/80 bg-clip-text">
            Campus Connect
          </span>
        </Link>
      </div>

      {/* Right Actions: Notifications & Messages (Instagram style) */}
      <div className="flex items-center gap-1.5 z-10">
        {isSignedIn ? (
          <>
            {/* Notifications Bell */}
            <Link
              href="/notifications"
              className="relative h-9 w-9 flex items-center justify-center rounded-full text-foreground/80 hover:text-foreground hover:bg-muted transition-colors active:scale-95"
              aria-label="Notifications"
            >
              <Bell className="h-5 w-5 stroke-[2.2]" />
              {typeof unreadNotifications === 'number' && unreadNotifications > 0 && (
                <span className="absolute top-1 right-1 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-critical px-1 text-[9px] font-black text-white shadow-sm ring-2 ring-card">
                  {unreadNotifications > 99 ? '99+' : unreadNotifications}
                </span>
              )}
            </Link>

            {/* Direct Messages */}
            <Link
              href="/messages"
              className="relative h-9 w-9 flex items-center justify-center rounded-full text-foreground/80 hover:text-foreground hover:bg-muted transition-colors active:scale-95"
              aria-label="Messages"
            >
              <MessageSquare className="h-5 w-5 stroke-[2.2]" />
              {typeof totalUnreadMessages === 'number' && totalUnreadMessages > 0 && (
                <span className="absolute top-1 right-1 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-critical px-1 text-[9px] font-black text-white shadow-sm ring-2 ring-card">
                  {totalUnreadMessages > 99 ? '99+' : totalUnreadMessages}
                </span>
              )}
            </Link>
          </>
        ) : (
          <Link
            href="/sign-in"
            className="text-xs font-semibold px-3.5 py-1.5 rounded-full bg-primary text-on-primary hover:bg-primary-deep transition-colors"
          >
            Log In
          </Link>
        )}
      </div>
    </header>
  );
}
