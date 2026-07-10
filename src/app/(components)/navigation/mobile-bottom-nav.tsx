'use client';

import { Home, Compass, MessageSquare, Bell, User } from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useUser } from '@/lib/auth/client';
import { useQuery } from '@/lib/api';
import { api } from '@/lib/api';

export function MobileBottomNav() {
  const pathname = usePathname();
  const { isSignedIn, user } = useUser();

  const unreadCount = useQuery(
    api.notifications.getUnreadCount,
    isSignedIn ? {} : 'skip'
  );

  const profileHref = user ? `/profile/${user.id}` : '/profile/me';

  const navItems = [
    { href: '/feed',          icon: Home,          label: 'Feed' },
    { href: '/explore',       icon: Compass,       label: 'Explore' },
    { href: '/messages',      icon: MessageSquare, label: 'Messages' },
    { href: '/notifications', icon: Bell,          label: 'Alerts', badge: typeof unreadCount === 'number' ? unreadCount : 0 },
    { href: profileHref,      icon: User,          label: 'Profile' },
  ];

  return (
    <div className="fixed bottom-0 left-0 right-0 border-t border-hairline-soft bg-canvas/95 backdrop-blur-sm z-20 lg:hidden">
      <nav className="flex items-center justify-around h-14">
        {navItems.map((item) => {
          const isActive =
            item.label === 'Profile'
              ? pathname.startsWith('/profile')
              : pathname === item.href || (item.href !== '/' && pathname.startsWith(item.href));
          return (
            <Link
              key={item.label}
              href={item.href}
              className={`relative flex flex-col items-center gap-0.5 py-1 px-2 w-full transition-colors duration-200 ${
                isActive ? 'text-primary' : 'text-steel'
              }`}
            >
              <item.icon className="h-5 w-5" />
              <span className="text-[10px] font-medium">{item.label}</span>
              {'badge' in item && typeof item.badge === 'number' && item.badge > 0 && (
                <span className="absolute top-0 right-1/4 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-critical px-1 text-[9px] font-bold text-white">
                  {item.badge > 99 ? '99+' : item.badge}
                </span>
              )}
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
