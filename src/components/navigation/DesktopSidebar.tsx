'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, Users, Briefcase, Store, Bell, LogOut, Settings, User, Sun, Moon } from 'lucide-react';
import { useUser, useAuthActions } from '@/lib/auth/client';
import { useQuery } from '@/lib/api';
import { api } from '@/lib/api';
import { cn } from '@/lib/utils';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { motion } from 'framer-motion';
import { useTheme } from 'next-themes';

export function DesktopSidebar() {
  const { isLoaded, isSignedIn, user } = useUser();
  const { signOut } = useAuthActions();
  const pathname = usePathname();
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const unreadCount = useQuery(
    api.notifications.getUnreadCount,
    isSignedIn ? {} : 'skip'
  );

  const currentUser = useQuery(
    api.users.getCurrentUser,
    isSignedIn ? {} : 'skip'
  );
  const isAdmin = currentUser && (currentUser.is_admin || currentUser.role === "admin");

  const isActive = (href: string) =>
    pathname === href || (href !== '/' && pathname.startsWith(href));

  const navLinks = [
    { href: '/feed', label: 'Feed', icon: Home },
    { href: '/communities', label: 'Communities', icon: Users },
    { href: '/jobs', label: 'Jobs', icon: Briefcase },
    { href: '/marketplace', label: 'Marketplace', icon: Store },
    ...(isAdmin ? [{ href: '/admin/dashboard', label: 'Admin', icon: require('lucide-react').ShieldAlert }] : []),
  ];

  return (
    <div className="flex flex-col h-full py-5 px-3 w-full">
      {/* Logo */}
      <Link href="/feed" className="flex items-center gap-3 mb-6 px-3 hover:opacity-80 transition-opacity">
        <div className="h-9 w-9 rounded-xl bg-primary flex items-center justify-center shrink-0">
          <span className="text-white text-sm font-bold">CC</span>
        </div>
        <span className="text-ink-deep font-bold text-lg tracking-tight hidden lg:block">
          Campus Connect
        </span>
      </Link>

      {/* Nav Links */}
      <nav className="flex-1 space-y-2">
        {navLinks.map((link) => {
          const active = isActive(link.href);
          return (
            <Link
              key={link.href}
              href={link.href}
              className="relative flex items-center gap-3 px-3 py-2.5 rounded-xl group transition-colors hover:bg-canvas">
              {active && (
                <motion.div
                  layoutId="sidebar-active"
                  className="absolute inset-0 bg-canvas border border-hairline rounded-xl"
                  initial={false}
                  transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                />
              )}
              <div className="relative z-10 flex items-center gap-3 w-full text-ink-deep">
                <link.icon className={cn('h-5 w-5', active ? 'stroke-[2.5px]' : 'stroke-2')} />
                <span className={cn('hidden lg:block text-sm', active ? 'font-bold' : 'font-medium')}>
                  {link.label}
                </span>
              </div>
            </Link>
          );
        })}
        
        {/* Notifications */}
        {isSignedIn && (
          <Link
            href="/notifications"
            className="relative flex items-center gap-3 px-3 py-2.5 rounded-xl group transition-colors hover:bg-canvas">
            <div className="relative z-10 flex items-center gap-3 w-full text-ink-deep">
              <div className="relative">
                <Bell className="h-5 w-5 stroke-2" />
                {typeof unreadCount === 'number' && unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-critical px-1 text-[10px] font-bold text-white">
                    {unreadCount > 99 ? '99+' : unreadCount}
                  </span>
                )}
              </div>
              <span className="hidden lg:block text-sm font-medium">
                Notifications
              </span>
            </div>
          </Link>
        )}
      </nav>

      {/* User Profile Footer */}
      {isLoaded && isSignedIn && user ? (
        <div className="mt-auto border-t border-hairline pt-4">
          <Link href="/profile/me" className="flex items-center gap-3 px-2 py-2 rounded-xl hover:bg-canvas transition-colors mb-1">
            <Avatar className="h-8 w-8">
              <AvatarImage src={user.profilePicture} alt={user.name} />
              <AvatarFallback className="bg-primary text-white text-xs font-bold">
                {user.name.substring(0, 2).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div className="hidden lg:block flex-1 min-w-0">
              <p className="text-sm font-semibold text-ink-deep truncate">{user.name}</p>
              <p className="text-xs text-slate truncate">View Profile</p>
            </div>
          </Link>
          
          <button
            onClick={() => setTheme(mounted && theme === 'dark' ? 'light' : 'dark')}
            className="flex items-center gap-3 px-3 py-2.5 rounded-xl w-full hover:bg-canvas text-ink-deep transition-colors mb-1"
            aria-label={mounted && theme === 'dark' ? "Switch to light mode" : "Switch to dark mode"}
          >
            {mounted && theme === 'dark' ? <Sun className="h-5 w-5 stroke-2" /> : <Moon className="h-5 w-5 stroke-2" />}
            <span className="hidden lg:block text-sm font-medium">
              {!mounted ? 'Theme' : theme === 'dark' ? 'Light Mode' : 'Dark Mode'}
            </span>
          </button>

          <button
            onClick={() => signOut({ redirectUrl: '/' })}
            className="flex items-center gap-3 px-3 py-2.5 rounded-xl w-full hover:bg-critical/10 text-critical transition-colors"
          >
            <LogOut className="h-4 w-4" />
            <span className="hidden lg:block text-sm font-medium">Log Out</span>
          </button>
        </div>
      ) : isLoaded && !isSignedIn ? (
        <div className="mt-auto pt-4 flex flex-col gap-2 px-2">
          <button
            onClick={() => setTheme(mounted && theme === 'dark' ? 'light' : 'dark')}
            className="flex items-center gap-3 px-3 py-2.5 rounded-xl w-full hover:bg-canvas text-ink-deep transition-colors mb-1"
            aria-label={mounted && theme === 'dark' ? "Switch to light mode" : "Switch to dark mode"}
          >
            {mounted && theme === 'dark' ? <Sun className="h-5 w-5 stroke-2" /> : <Moon className="h-5 w-5 stroke-2" />}
            <span className="hidden lg:block text-sm font-medium">
              {!mounted ? 'Theme' : theme === 'dark' ? 'Light Mode' : 'Dark Mode'}
            </span>
          </button>

          <Link
            href="/sign-in"
            className="button-ghost w-full"
          >
            Log In
          </Link>
          <Link
            href="/sign-up"
            className="button-primary w-full"
          >
            Sign Up
          </Link>
        </div>
      ) : null}
    </div>
  );
}
