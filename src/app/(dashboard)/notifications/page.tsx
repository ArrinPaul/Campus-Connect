'use client';

import { useQuery, useMutation } from 'convex/react';
import { api } from '@/../convex/_generated/api';
import { NotificationItem } from '@/components/notifications/NotificationItem';
import { Bell, CheckCheck } from 'lucide-react';

export default function NotificationsPage() {
  const data = useQuery(api.notifications.getNotifications, {});
  const markAllAsRead = useMutation(api.notifications.markAllAsRead);

  // Backend returns { notifications: [...], cursor: null }, not a plain array
  const notifications = data?.notifications;
  const unreadCount = notifications?.filter((n) => !n.isRead).length ?? 0;

  return (
    <div className="max-w-2xl mx-auto py-8 px-4">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <Bell className="h-7 w-7 text-primary" />
          <h1 className="text-3xl font-bold">Notifications</h1>
          {unreadCount > 0 && (
            <span className="bg-primary text-primary-foreground text-xs font-semibold px-2 py-0.5 rounded-full">
              {unreadCount}
            </span>
          )}
        </div>
        {unreadCount > 0 && (
          <button
            onClick={() => markAllAsRead()}
            className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            <CheckCheck className="h-4 w-4" />
            Mark all as read
          </button>
        )}
      </div>

      {notifications === undefined ? (
        <div className="space-y-3">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="border rounded-lg bg-card p-4 h-20 animate-pulse" />
          ))}
        </div>
      ) : notifications.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <Bell className="h-16 w-16 text-muted-foreground mb-4 opacity-30" />
          <h2 className="text-xl font-semibold text-muted-foreground">No notifications yet</h2>
          <p className="text-sm text-muted-foreground mt-1">
            When someone interacts with you, you&apos;ll see it here.
          </p>
        </div>
      ) : (
        <div className="divide-y divide-border border rounded-lg bg-card overflow-hidden">
          {notifications.map((notification) => (
            <NotificationItem key={notification._id} notification={notification} />
          ))}
        </div>
      )}
    </div>
  );
}
