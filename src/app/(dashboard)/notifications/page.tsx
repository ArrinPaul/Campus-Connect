'use client';

import { useQuery, useMutation } from '@/lib/api';
import { useUser } from '@/lib/auth/client';
import { api } from '@/lib/api';
import { NotificationItem } from '@/components/notifications/NotificationItem';
import { Bell, CheckCheck, Inbox } from 'lucide-react';
import { Section, SectionHeader } from '@/components/ui/Section';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

export default function NotificationsPage() {
  const { isSignedIn, isLoaded } = useUser();
  const isLoading = !isLoaded;
  const isAuthenticated = isSignedIn ?? false;
  const data = useQuery(api.notifications.getNotifications, isAuthenticated ? {} : 'skip');
  const markAllAsRead = useMutation(api.notifications.markAllAsRead);

  const notifications = data?.notifications;
  const unreadCount = notifications?.filter((n: any) => !n.isRead).length ?? 0;

  if (isLoading) {
    return (
      <div className="w-full bg-canvas min-h-screen">
        <Section variant="parchment" className="py-xl">
           <div className="h-12 w-48 bg-canvas animate-pulse rounded mx-auto" />
        </Section>
        <div className="max-w-2xl mx-auto py-8 px-4 space-y-4">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="h-24 w-full bg-canvas-parchment animate-pulse rounded-lg" />
          ))}
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="w-full bg-canvas min-h-screen flex flex-col items-center justify-center p-8 text-center">
        <div className="p-6 rounded-full bg-canvas-parchment text-ink/10 mb-6">
           <Bell size={64} />
        </div>
        <h2 className="text-display-md text-ink">Stay in the loop.</h2>
        <p className="text-body text-ink-muted-48 mt-2 max-w-xs">
          Sign in to view your notifications and stay connected with your community.
        </p>
        <Button variant="primary" size="lg" className="mt-8" onClick={() => window.location.href = '/sign-in'}>
          Sign In to Continue
        </Button>
      </div>
    );
  }

  return (
    <div className="w-full bg-canvas min-h-screen">
      {/* Header Section */}
      <Section variant="parchment" className="py-xl border-b border-hairline">
        <SectionHeader 
          title="Notifications." 
          tagline="Keep track of likes, comments, and community updates in one place."
        >
          {unreadCount > 0 && (
            <Button
              variant="pearl"
              size="sm"
              className="flex items-center gap-2"
              onClick={() => markAllAsRead()}
            >
              <CheckCheck size={16} /> Mark all as read
            </Button>
          )}
        </SectionHeader>
      </Section>

      <main className="w-full flex flex-col items-center">
        <div className="w-full">
           {notifications === undefined ? (
              <div className="max-w-2xl mx-auto py-8 px-4 space-y-4">
                {[...Array(5)].map((_, i) => (
                  <div key={i} className="h-24 w-full bg-canvas-parchment animate-pulse rounded-lg" />
                ))}
              </div>
           ) : notifications.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-32 text-center">
                <div className="p-6 rounded-full bg-canvas-parchment text-ink/10 mb-6">
                  <Inbox size={64} />
                </div>
                <h3 className="text-display-md text-ink">All caught up.</h3>
                <p className="text-body text-ink-muted-48 mt-2">
                  When new activity happens, you&apos;ll see it here.
                </p>
              </div>
           ) : (
              <div className="w-full">
                <div className="max-w-2xl mx-auto px-4 py-6">
                   <div className="text-fine-print text-ink-muted-48 font-bold uppercase tracking-widest mb-2">
                      Recent Activity {unreadCount > 0 && `(${unreadCount} unread)`}
                   </div>
                </div>
                <div className="border-t border-hairline">
                  {notifications.map((notification: any) => (
                    <NotificationItem key={notification._id} notification={notification} />
                  ))}
                </div>
                <div className="py-12 flex justify-center">
                   <p className="text-fine-print text-ink-muted-48 font-semibold uppercase tracking-widest">End of Notifications</p>
                </div>
              </div>
           )}
        </div>
      </main>
    </div>
  );
}
