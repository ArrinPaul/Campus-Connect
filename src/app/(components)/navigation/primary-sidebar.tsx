'use client';

import {
  Home, MessageSquare, Compass, Bell, User, Settings, LogOut,
  Briefcase, Users, Bookmark, Calendar, ShoppingBag, FlaskConical,
  FolderOpen, HelpCircle, Trophy, UserSearch, Handshake, BookOpen,
} from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useUser, useAuthActions } from '@/lib/auth/client';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';

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
  { href: '/find-experts',   icon: UserSearch, label: 'Find Experts' },
  { href: '/find-partners',  icon: Handshake,  label: 'Find Partners' },
  { href: '/stories',        icon: BookOpen,   label: 'Stories' },
];

function NavLink({ item, pathname }: { item: NavItem; pathname: string }) {
  const active = pathname === item.href || (item.href !== '/' && pathname.startsWith(item.href));
  return (
    <Link
      href={item.href}
      className={`flex items-center gap-3 rounded-lg px-3 py-2 text-body-sm font-medium transition-colors ${
        active
          ? 'bg-primary/10 text-primary'
          : 'text-muted-foreground hover:bg-card hover:text-foreground'
      }`}
    >
      <item.icon className="h-4 w-4 flex-shrink-0" />
      <span>{item.label}</span>
    </Link>
  );
}

export function PrimarySidebar() {
  const pathname = usePathname();
  const { user } = useUser();
  const { signOut } = useAuthActions();

  return (
    <aside className="hidden lg:flex h-full w-60 flex-col border-r border-border/50 bg-card">
      {/* Logo */}
      <div className="flex items-center gap-2 px-4 py-4 border-b border-border/50">
        <Link href="/feed" className="flex items-center gap-2">
          <div className="h-8 w-8 rounded-lg bg-primary flex items-center justify-center shrink-0">
            <span className="text-white text-sm font-bold">CC</span>
          </div>
          <span className="font-bold text-foreground text-body-md-bold tracking-tight">Campus Connect</span>
        </Link>
      </div>

      {/* User profile summary */}
      {user && (
        <div className="px-3 py-3 border-b border-border/50">
          <Link href="/profile/me" className="flex items-center gap-3 p-2 rounded-lg hover:bg-card transition-colors">
            <Avatar className="h-9 w-9">
              <AvatarImage src={user.profilePicture} alt={user.name} />
              <AvatarFallback className="bg-primary text-white text-caption-bold">
                {user.name.substring(0, 2).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div className="min-w-0">
              <p className="text-body-sm-bold text-foreground truncate">{user.name}</p>
              <p className="text-caption text-muted-foreground truncate">{user.email}</p>
            </div>
          </Link>
        </div>
      )}

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
          <p className="px-3 mb-1 text-caption-bold font-semibold text-stone uppercase tracking-wider">
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
          <p className="px-3 mb-1 text-caption-bold font-semibold text-stone uppercase tracking-wider">
            Campus Life
          </p>
          <nav className="space-y-1">
            {campusNavItems.map((item) => (
              <NavLink key={item.href} item={item} pathname={pathname} />
            ))}
          </nav>
        </div>
      </div>

      {/* Bottom: settings, logout */}
      <div className="border-t border-border/50 px-2 py-3 space-y-1">
        <NavLink item={{ href: '/settings', icon: Settings, label: 'Settings' }} pathname={pathname} />
        <button
          onClick={() => signOut({ redirectUrl: '/' })}
          className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-body-sm font-medium text-muted-foreground transition-colors hover:bg-critical/5 hover:text-critical"
        >
          <LogOut className="h-4 w-4 flex-shrink-0" />
          <span>Sign Out</span>
        </button>
      </div>
    </aside>
  );
}
