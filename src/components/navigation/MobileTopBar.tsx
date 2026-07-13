'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Search, Bell } from 'lucide-react';
import { useUser } from '@/lib/auth/client';
import { useQuery } from '@/lib/api';
import { api } from '@/lib/api';

export function MobileTopBar() {
  const { isLoaded, isSignedIn, user } = useUser();
  const pathname = usePathname();

  const unreadCount = useQuery(
    api.notifications.getUnreadCount,
    isSignedIn ? {} : 'skip'
  );

  return (
    <nav className="flex items-center justify-between h-14 px-4 bg-white/70 dark:bg-black/70 backdrop-blur-xl border-b border-hairline-soft sticky top-0 z-50">
      {/* Left: Logo */}
      <Link href="/feed" className="flex items-center gap-2 shrink-0">
        <div className="h-8 w-8 rounded-xl bg-primary flex items-center justify-center">
          <span className="text-white text-sm font-bold">CC</span>
        </div>
      </Link>

      {/* Right: Actions */}
      <div className="flex items-center gap-2">
        <Link
          href="/search"
          className="h-9 w-9 flex items-center justify-center rounded-full bg-surface-soft text-ink hover:bg-hairline transition-colors"
        >
          <Search className="h-5 w-5" />
        </Link>

        {isSignedIn && (
          <Link
            href="/notifications"
            className="relative h-9 w-9 flex items-center justify-center rounded-full bg-surface-soft text-ink hover:bg-hairline transition-colors"
          >
            <Bell className="h-5 w-5" />
            {typeof unreadCount === 'number' && unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-critical px-1 text-[10px] font-bold text-white border-2 border-canvas">
                {unreadCount > 99 ? '99+' : unreadCount}
              </span>
            )}
          </Link>
        )}
      </div>
    </nav>
  );
}
