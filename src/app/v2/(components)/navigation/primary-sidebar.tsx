'use client';

import {
  Home,
  MessageSquare,
  Compass,
  Bell,
  User,
  Settings,
  LogOut,
  Briefcase,
  Users,
} from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

const mainNavItems = [
  { href: '/feed', icon: Home, label: 'Feed' },
  { href: '/messages', icon: MessageSquare, label: 'Messages' },
  { href: '/explore', icon: Compass, label: 'Explore' },
  { href: '/communities', icon: Users, label: 'Communities' },
  { href: '/jobs', icon: Briefcase, label: 'Jobs' },
  { href: '/notifications', icon: Bell, label: 'Notifications' },
];

const userNavItems = [
    { href: '/profile/me', icon: User, label: 'Profile' },
    { href: '/settings', icon: Settings, label: 'Settings' },
]

export function PrimarySidebar() {
  const pathname = usePathname();

  return (
    <div className="flex h-full flex-col items-center justify-between border-r bg-card p-2">
        <div className="flex flex-col items-center gap-4">
            <Link href="/feed" className="mb-4 mt-2">
                {/* Placeholder for Logo */}
                <div className="h-8 w-8 rounded-lg bg-primary" />
            </Link>
            <nav className="flex flex-col items-center gap-2">
                {mainNavItems.map((item) => (
                <Link
                    key={item.label}
                    href={item.href}
                    title={item.label}
                    className={`flex items-center justify-center rounded-lg p-3 transition-colors
                    ${
                        pathname.startsWith(item.href)
                        ? 'bg-primary text-primary-foreground'
                        : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                    }`}
                >
                    <item.icon className="h-5 w-5" />
                </Link>
                ))}
            </nav>
        </div>
        <div className="flex flex-col items-center gap-2 pb-2">
             {userNavItems.map((item) => (
                <Link
                    key={item.label}
                    href={item.href}
                    title={item.label}
                    className={`flex items-center justify-center rounded-lg p-3 transition-colors
                    ${
                        pathname.startsWith(item.href)
                        ? 'bg-primary text-primary-foreground'
                        : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                    }`}
                >
                    <item.icon className="h-5 w-5" />
                </Link>
            ))}
            <div className="h-px w-8 bg-border my-2" />
            <button
                title="Log Out"
                className="flex items-center justify-center rounded-lg p-3 text-muted-foreground transition-colors hover:bg-destructive hover:text-destructive-foreground"
            >
                <LogOut className="h-5 w-5" />
            </button>
        </div>
    </div>
  );
}
