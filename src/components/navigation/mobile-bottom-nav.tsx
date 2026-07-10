'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, Users, Briefcase, ShoppingBag, Bell } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useUser } from '@/lib/auth/client';
import { useQuery } from '@/lib/api';
import { api } from '@/lib/api';

const navItems = [
  { href: '/feed', icon: Home, label: 'Feed' },
  { href: '/communities', icon: Users, label: 'Groups' },
  { href: '/jobs', icon: Briefcase, label: 'Jobs' },
  { href: '/marketplace', icon: ShoppingBag, label: 'Shop' },
  { href: '/notifications', icon: Bell, label: 'Alerts' },
];

export function MobileBottomNav() {
  const pathname = usePathname();
  const { isSignedIn } = useUser();
  const unreadCount = useQuery(
    api.notifications.getUnreadCount,
    isSignedIn ? {} : 'skip'
  );

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 h-16 bg-canvas border-t border-hairline-soft flex items-center justify-around px-2 z-50">
      {navItems.map((item) => {
        const isActive = pathname === item.href || (item.href !== '/' && pathname.startsWith(item.href));
        
        return (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "flex flex-col items-center justify-center w-full h-full gap-1 transition-colors relative",
              isActive ? "text-ink-deep" : "text-steel hover:text-ink-deep"
            )}
          >
            <item.icon className={cn("w-6 h-6", isActive ? "stroke-[2.5px]" : "stroke-2")} />
            <span className={cn("text-[10px] font-bold", isActive ? "text-ink-deep" : "text-steel")}>
              {item.label}
            </span>
            {item.href === '/notifications' && typeof unreadCount === 'number' && unreadCount > 0 && (
              <span className="absolute top-1 right-2 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-critical px-1 text-[10px] font-bold text-white border-2 border-canvas">
                {unreadCount > 99 ? '99+' : unreadCount}
              </span>
            )}
          </Link>
        );
      })}
    </nav>
  );
}
