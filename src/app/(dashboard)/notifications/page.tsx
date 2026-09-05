'use client';

import { useState } from 'react';
import { useQuery, useMutation } from '@/lib/api';
import { useUser } from '@/lib/auth/client';
import { api } from '@/lib/api';
import { NotificationItem } from '@/components/notifications/NotificationItem';
import { groupNotifications } from '@/lib/notifications/group';
import { EmptyState } from '@/components/ui/empty-state';
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

  // GET /api/notifications returns a bare array, not { notifications: [...] }
  const notifications = data;
  const unreadCount = notifications?.filter((n: any) => !n.read).length ?? 0;

  const groupedNotifications = notifications ? groupNotifications(notifications) : undefined;
  const filteredNotifications = groupedNotifications?.filter((n) => {
    if (filter === 'unread') return !n.read;
    return true;
  });

  if (isLoading) {
    return (
      <div className="w-full bg-canvas min-h-screen py-8 px-4">
        <div className="max-w-2xl mx-auto space-y-4">
          <div className="h-10 w-48 bg-card animate-pulse rounded-lg" />
          {[...Array(5)].map((_, i) => (
            <div key={i} className="h-20 w-full bg-card animate-pulse rounded-lg border border-border" />
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
        <h2 className="text-2xl font-bold text-foreground">Stay in the loop</h2>
        <p className="text-xs text-muted-foreground mt-1 max-w-xs">
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
      <section className="bg-card py-6 px-4 md:px-8 border-b border-border shadow-sm">
        <div className="max-w-2xl mx-auto flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-heading-lg font-bold text-foreground mb-1">Notifications</h1>
            <p className="text-xs text-muted-foreground mt-1">
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
        <div className="flex items-center gap-2 border-b border-border pb-3">
          <button
            onClick={() => setFilter('all')}
            className={cn(
              "px-4 py-1.5 rounded-full text-xs font-semibold transition-all cursor-pointer active:scale-[0.96]",
              filter === 'all'
                ? "bg-primary text-white shadow-sm"
                : "bg-card text-muted-foreground border border-border hover:border-primary/40 hover:text-primary"
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
                : "bg-card text-muted-foreground border border-border hover:border-primary/40 hover:text-primary"
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
              <div key={i} className="h-20 w-full bg-card animate-pulse rounded-lg border border-border" />
            ))}
          </div>
        ) : filteredNotifications?.length === 0 ? (
          <EmptyState
            icon={Inbox}
            title={filter === 'unread' ? 'No unread notifications' : 'All caught up'}
            description={
              filter === 'unread'
                ? 'You have read all your notifications.'
                : 'When new activity happens, it will appear here.'
            }
          />
        ) : (
          <div className="rounded-lg border border-border bg-card overflow-hidden divide-y divide-hairline">
            {filteredNotifications?.map((notification) => (
              <NotificationItem key={notification.ids.join('-')} notification={notification} />
            ))}
          </div>
        )}
      </main>
    </div>
  );
}


