'use client';

import {
  Home, MessageSquare, Compass, Bell, User, Settings, LogOut,
  Briefcase, Users, Bookmark, Calendar, ShoppingBag, FlaskConical,
  FolderOpen, HelpCircle, Trophy, UserSearch, Handshake, BookOpen,
} from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useClerk } from '@clerk/nextjs';
import { ThemeToggle } from '@/components/theme/theme-toggle';

type NavItem = { href: string; icon: React.ElementType; label: string };

const mainNavItems: NavItem[] = [
  { href: '/feed',          icon: Home,          label: 'Feed' },
  { href: '/explore',       icon: Compass,       label: 'Explore' },
  { href: '/messages',      icon: MessageSquare, label: 'Messages' },
  { href: '/notifications', icon: Bell,          label: 'Notifications' },
  { href: '/bookmarks',     icon: Bookmark,      label: 'Bookmarks' },
];

const academicNavItems: NavItem[] = [
  { href: '/communities',  icon: Users,        label: 'Communities' },
  { href: '/events',       icon: Calendar,     label: 'Events' },
  { href: '/research',     icon: FlaskConical, label: 'Research' },
  { href: '/q-and-a',      icon: HelpCircle,   label: 'Q&A' },
  { href: '/resources',    icon: FolderOpen,   label: 'Resources' },
];

const campusNavItems: NavItem[] = [
  { href: '/jobs',           icon: Briefcase,  label: 'Jobs' },
  { href: '/marketplace',    icon: ShoppingBag,label: 'Marketplace' },
  { href: '/leaderboard',    icon: Trophy,     label: 'Leaderboard' },
  { href: '/find-experts',   icon: UserSearch, label: 'Find Experts' },
  { href: '/find-partners',  icon: Handshake,  label: 'Find Partners' },
  { href: '/stories',        icon: BookOpen,   label: 'Stories' },
];

function NavLink({ item, pathname }: { item: NavItem; pathname: string }) {
  const active = pathname === item.href || (item.href !== '/' && pathname.startsWith(item.href));
  return (
    <Link
      href={item.href}
      className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
        active
          ? 'bg-primary text-primary-foreground'
          : 'text-muted-foreground hover:bg-muted hover:text-foreground'
      }`}
    >
      <item.icon className="h-4 w-4 flex-shrink-0" />
      <span>{item.label}</span>
    </Link>
  );
}

export function PrimarySidebar() {
  const pathname = usePathname();
  const { signOut } = useClerk();

  return (
    <div className="flex h-full w-60 flex-col border-r bg-card">
      {/* Logo */}
      <div className="flex items-center gap-2 px-4 py-5 border-b">
        <Link href="/feed" className="flex items-center gap-2">
          <div className="h-7 w-7 rounded-lg bg-primary flex-shrink-0" />
          <span className="font-bold text-base tracking-tight">Campus Connect</span>
        </Link>
      </div>

      {/* Scrollable nav */}
      <div className="flex-1 overflow-y-auto py-3 px-2 space-y-5 scrollbar-thin">
        {/* Main */}
        <nav className="space-y-1">
          {mainNavItems.map((item) => (
            <NavLink key={item.href} item={item} pathname={pathname} />
          ))}
        </nav>

        {/* Academic */}
        <div>
          <p className="px-3 mb-1 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
            Academic
          </p>
          <nav className="space-y-1">
            {academicNavItems.map((item) => (
              <NavLink key={item.href} item={item} pathname={pathname} />
            ))}
          </nav>
        </div>

        {/* Campus Life */}
        <div>
          <p className="px-3 mb-1 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
            Campus Life
          </p>
          <nav className="space-y-1">
            {campusNavItems.map((item) => (
              <NavLink key={item.href} item={item} pathname={pathname} />
            ))}
          </nav>
        </div>
      </div>

      {/* Bottom: profile, settings, theme, logout */}
      <div className="border-t px-2 py-3 space-y-1">
        <NavLink item={{ href: '/profile/me', icon: User, label: 'Profile' }} pathname={pathname} />
        <NavLink item={{ href: '/settings', icon: Settings, label: 'Settings' }} pathname={pathname} />
        <div className="flex items-center justify-between px-3 py-1">
          <span className="text-sm font-medium text-muted-foreground">Theme</span>
          <ThemeToggle />
        </div>
        <button
          onClick={() => signOut({ redirectUrl: '/' })}
          className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive"
        >
          <LogOut className="h-4 w-4 flex-shrink-0" />
          <span>Log Out</span>
        </button>
      </div>
    </div>
  );
}
