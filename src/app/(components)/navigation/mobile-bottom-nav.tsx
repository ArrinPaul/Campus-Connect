'use client';

import { Home, Compass, MessageSquare, Bell, User } from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useQuery } from 'convex/react';
import { api } from '@/convex/_generated/api';

export function MobileBottomNav() {
  const pathname = usePathname();
  const currentUser = useQuery(api.users.getCurrentUser);

  const profileHref = currentUser ? `/profile/${currentUser._id}` : '/profile/me';

  const navItems = [
    { href: '/feed',          icon: Home,          label: 'Feed' },
    { href: '/explore',       icon: Compass,       label: 'Explore' },
    { href: '/messages',      icon: MessageSquare, label: 'Messages' },
    { href: '/notifications', icon: Bell,          label: 'Alerts' },
    { href: profileHref,      icon: User,          label: 'Profile' },
  ];

  return (
    <div className="fixed bottom-0 left-0 right-0 border-t bg-background/80 backdrop-blur-sm z-20">
      <nav className="flex items-center justify-around">
        {navItems.map((item) => {
          // Profile active state should match /profile/...
          const isActive =
            item.label === 'Profile'
              ? pathname.startsWith('/profile')
              : pathname === item.href || (item.href !== '/' && pathname.startsWith(item.href));
          return (
            <Link
              key={item.label}
              href={item.href}
              className={`flex flex-col items-center gap-1 py-2 px-1 w-full transition-colors duration-200 ${
                isActive ? 'text-primary' : 'text-muted-foreground'
              }`}
            >
              <item.icon className="h-5 w-5" />
              <span className="text-[10px] font-medium">{item.label}</span>
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
