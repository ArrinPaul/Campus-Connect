'use client';

import { Home, Compass, MessageSquare, Bell, User } from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

const navItems = [
  { href: '/feed', icon: Home, label: 'Feed' },
  { href: '/explore', icon: Compass, label: 'Explore' },
  { href: '/messages', icon: MessageSquare, label: 'Messages' },
  { href: '/notifications', icon: Bell, label: 'Notifications' },
  { href: '/profile/me', icon: User, label: 'Profile' },
];

export function MobileBottomNav() {
  const pathname = usePathname();

  return (
    <div className="fixed bottom-0 left-0 right-0 border-t bg-background/80 backdrop-blur-sm">
      <nav className="flex items-center justify-around">
        {navItems.map((item) => (
          <Link
            key={item.label}
            href={item.href}
            className={`flex flex-col items-center gap-1 py-2 px-1 w-full
            ${
              pathname.startsWith(item.href)
                ? 'text-primary'
                : 'text-muted-foreground'
            }
            transition-colors duration-200 ease-in-out`}
          >
            <item.icon className="h-5 w-5" />
            <span className="text-2xs font-medium">{item.label}</span>
          </Link>
        ))}
      </nav>
    </div>
  );
}
