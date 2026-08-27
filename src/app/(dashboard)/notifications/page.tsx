'use client';

import { useState } from 'react';
import { useQuery, useMutation } from '@/lib/api';
import { useUser } from '@/lib/auth/client';
import { api } from '@/lib/api';
import { NotificationItem } from '@/components/notifications/NotificationItem';
import { Bell, CheckCheck, Inbox, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

export default function NotificationsPage() {
  const { isSignedIn, isLoaded } = useUser();
  const isLoading = !isLoaded;
  const isAuthenticated = isSignedIn ?? false;
  const data = useQuery(api.notifications.getNotifications, isAuthenticated ? {} : 'skip');
  const markAllAsRead = useMutation(api.notifications.markAllAsRead);

  const [filter, setFilter] = useState<'all' | 'unread'>('all');

  const notifications = data?.notifications;
  const unreadCount = notifications?.filter((n: any) => !n.isRead).length ?? 0;

  const filteredNotifications = notifications?.filter((n: any) => {
    if (filter === 'unread') return !n.isRead;
    return true;
  });

  if (isLoading) {
    return (
      <div className="w-full bg-canvas min-h-screen py-8 px-4">
        <div className="max-w-2xl mx-auto space-y-4">
          <div className="h-10 w-48 bg-surface-soft animate-pulse rounded-xl" />
          {[...Array(5)].map((_, i) => (
            <div key={i} className="h-20 w-full bg-surface-soft animate-pulse rounded-2xl border border-hairline" />
          ))}
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="w-full bg-canvas min-h-screen flex flex-col items-center justify-center p-8 text-center">
        <div className="p-5 rounded-full bg-primary/10 text-primary mb-4">
          <Bell size={48} />
        </div>
        <h2 className="text-2xl font-bold text-ink-deep">Stay in the loop</h2>
        <p className="text-xs text-slate mt-1 max-w-xs">
          Sign in to view your notifications and stay updated with your campus network.
        </p>
        <Button variant="primary" size="default" className="mt-6 rounded-full px-6" onClick={() => window.location.href = '/sign-in'}>
          Sign In to Continue
        </Button>
      </div>
    );
  }

  return (
    <div className="w-full bg-canvas min-h-screen pb-16">
      {/* Header Section */}
      <section className="bg-surface-soft py-6 px-4 md:px-8 border-b border-hairline shadow-sm">
        <div className="max-w-2xl mx-auto flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-heading-lg font-bold text-ink-deep mb-1">Notifications</h1>
            <p className="text-xs text-slate mt-1">
              Keep track of likes, comments, and community updates.
            </p>
          </div>
          {unreadCount > 0 && (
            <button
              onClick={() => markAllAsRead()}
              className="flex items-center gap-1.5 rounded-full bg-primary/10 px-4 py-2 text-xs font-bold text-primary hover:bg-primary/20 transition-all shrink-0 cursor-pointer active:scale-[0.97]"
            >
              <CheckCheck size={14} /> Mark all as read ({unreadCount})
            </button>
          )}
        </div>
      </section>

      {/* Main Content */}
      <main className="max-w-2xl mx-auto px-4 pt-6 space-y-4">
        {/* Filter Pills */}
        <div className="flex items-center gap-2 border-b border-hairline pb-3">
          <button
            onClick={() => setFilter('all')}
            className={cn(
              "px-4 py-1.5 rounded-full text-xs font-semibold transition-all cursor-pointer active:scale-[0.96]",
              filter === 'all'
                ? "bg-primary text-white shadow-sm"
                : "bg-surface-soft text-slate border border-hairline hover:border-primary/40 hover:text-primary"
            )}
          >
            All Activity
          </button>
          <button
            onClick={() => setFilter('unread')}
            className={cn(
              "px-4 py-1.5 rounded-full text-xs font-semibold transition-all cursor-pointer active:scale-[0.96] flex items-center gap-1.5",
              filter === 'unread'
                ? "bg-primary text-white shadow-sm"
                : "bg-surface-soft text-slate border border-hairline hover:border-primary/40 hover:text-primary"
            )}
          >
            Unread
            {unreadCount > 0 && (
              <span className={cn(
                "px-1.5 py-0.5 rounded-full text-[10px] font-bold",
                filter === 'unread' ? "bg-white text-primary" : "bg-primary text-white"
              )}>
                {unreadCount}
              </span>
            )}
          </button>
        </div>

        {/* Notifications List */}
        {notifications === undefined ? (
          <div className="space-y-3">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-20 w-full bg-surface-soft animate-pulse rounded-2xl border border-hairline" />
            ))}
          </div>
        ) : filteredNotifications?.length === 0 ? (
          <div className="text-center py-20 bg-surface-soft rounded-2xl border border-hairline">
            <Inbox className="h-12 w-12 mx-auto mb-3 text-slate opacity-40" />
            <h3 className="text-base font-semibold text-ink-deep">
              {filter === 'unread' ? 'No unread notifications' : 'All caught up'}
            </h3>
            <p className="text-xs text-slate mt-1 max-w-xs mx-auto">
              {filter === 'unread'
                ? 'You have read all your notifications.'
                : 'When new activity happens, it will appear here.'}
            </p>
          </div>
        ) : (
          <div className="rounded-2xl border border-hairline bg-surface-soft overflow-hidden divide-y divide-hairline">
            {filteredNotifications?.map((notification: any) => (
              <NotificationItem key={notification._id} notification={notification} />
            ))}
          </div>
        )}
      </main>
    </div>
  );
}


