'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, Users, Briefcase, Store, Bell, LogOut, Settings, User } from 'lucide-react';
import { useUser, useAuthActions } from '@/lib/auth/client';
import { useQuery } from '@/lib/api';
import { api } from '@/lib/api';
import { cn } from '@/lib/utils';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { motion } from 'framer-motion';

export function DesktopSidebar() {
  const { isLoaded, isSignedIn, user } = useUser();
  const { signOut } = useAuthActions();
  const pathname = usePathname();

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
    <div className="flex flex-col h-full py-6 px-4 w-full">
      {/* Logo */}
      <Link href="/feed" className="flex items-center gap-3 mb-8 px-4 hover:opacity-80 transition-opacity">
        <div className="h-10 w-10 rounded-2xl bg-primary flex items-center justify-center shrink-0">
          <span className="text-white text-lg font-bold">CC</span>
        </div>
        <span className="text-ink-deep font-bold text-heading-sm tracking-tight hidden lg:block">
          Connect
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
              className="relative flex items-center gap-4 px-4 py-3 rounded-full group transition-colors"
            >
              {active && (
                <motion.div
                  layoutId="sidebar-active"
                  className="absolute inset-0 bg-surface-soft rounded-full"
                  initial={false}
                  transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                />
              )}
              <div className="relative z-10 flex items-center gap-4 w-full text-ink-deep">
                <link.icon className={cn('h-6 w-6', active ? 'stroke-[2.5px]' : 'stroke-2')} />
                <span className={cn('hidden lg:block text-body-md', active ? 'font-bold' : 'font-medium')}>
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
            className="relative flex items-center gap-4 px-4 py-3 rounded-full group transition-colors hover:bg-surface-soft"
          >
            <div className="relative z-10 flex items-center gap-4 w-full text-ink-deep">
              <div className="relative">
                <Bell className="h-6 w-6 stroke-2" />
                {typeof unreadCount === 'number' && unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-critical px-1 text-caption-bold text-white border-2 border-canvas">
                    {unreadCount > 99 ? '99+' : unreadCount}
                  </span>
                )}
              </div>
              <span className="hidden lg:block text-body-md font-medium">
                Notifications
              </span>
            </div>
          </Link>
        )}
      </nav>

      {/* User Profile Footer */}
      {isLoaded && isSignedIn && user ? (
        <div className="mt-auto border-t border-hairline-soft pt-4">
          <Link href="/profile/me" className="flex items-center gap-3 px-2 py-2 rounded-full hover:bg-surface-soft transition-colors mb-2">
            <Avatar className="h-10 w-10">
              <AvatarImage src={user.profilePicture} alt={user.name} />
              <AvatarFallback className="bg-primary text-white text-caption-bold">
                {user.name.substring(0, 2).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div className="hidden lg:block flex-1 min-w-0">
              <p className="text-body-sm-bold text-ink-deep truncate">{user.name}</p>
              <p className="text-caption text-steel truncate">View Profile</p>
            </div>
          </Link>
          
          <button
            onClick={() => signOut({ redirectUrl: '/' })}
            className="flex items-center gap-4 px-4 py-3 rounded-full w-full hover:bg-critical/10 text-critical transition-colors group"
          >
            <LogOut className="h-5 w-5" />
            <span className="hidden lg:block text-body-md font-medium">Log Out</span>
          </button>
        </div>
      ) : isLoaded && !isSignedIn ? (
        <div className="mt-auto pt-4 space-y-2">
          <Link
            href="/sign-in"
            className="block w-full py-3 text-center rounded-full text-button-md text-ink-deep border border-ink-deep hover:bg-surface-soft transition-colors"
          >
            Log In
          </Link>
          <Link
            href="/sign-up"
            className="block w-full py-3 text-center rounded-full text-button-md bg-ink-deep text-canvas hover:opacity-90 transition-colors"
          >
            Sign Up
          </Link>
        </div>
      ) : null}
    </div>
  );
}
