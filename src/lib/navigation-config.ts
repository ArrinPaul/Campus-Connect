import {
  Home,
  Sparkles,
  Compass,
  Bookmark,
  Users,
  Calendar,
  Briefcase,
  Store,
  BookOpen,
  FolderOpen,
  HelpCircle,
  Trophy,
  Bell,
  MessageCircle,
  Search,
  User,
  Settings,
  LucideIcon,
} from 'lucide-react';

export interface NavItem {
  id: string;
  label: string;
  href: string;
  icon: LucideIcon;
  exact?: boolean;
  badgeKey?: 'notifications' | 'messages';
  desktop: boolean;
  mobileBottom?: boolean;
  description?: string;
}

export const MAIN_NAV_ITEMS: NavItem[] = [
  {
    id: 'home',
    label: 'Home',
    href: '/feed',
    icon: Home,
    exact: true,
    desktop: true,
    description: 'Campus feed & updates',
  },
  {
    id: 'explore',
    label: 'Explore',
    href: '/explore',
    icon: Compass,
    desktop: true,
    description: 'Discover trending campus content',
  },
  {
    id: 'saved',
    label: 'Saved',
    href: '/bookmarks',
    icon: Bookmark,
    desktop: true,
    description: 'Your saved bookmarks & posts',
  },
  {
    id: 'groups',
    label: 'Groups',
    href: '/communities',
    icon: Users,
    desktop: true,
    description: 'Student clubs, batches & communities',
  },
  {
    id: 'events',
    label: 'Events',
    href: '/events',
    icon: Calendar,
    desktop: true,
    description: 'Campus workshops, hackathons & meetups',
  },
  {
    id: 'jobs',
    label: 'Jobs',
    href: '/jobs',
    icon: Briefcase,
    desktop: true,
    description: 'Internships, TA roles & campus careers',
  },
  {
    id: 'marketplace',
    label: 'Marketplace',
    href: '/marketplace',
    icon: Store,
    desktop: true,
    description: 'Textbooks, dorm items & gear',
  },
  {
    id: 'research',
    label: 'Research',
    href: '/research',
    icon: BookOpen,
    desktop: true,
    description: 'Academic papers & student preprints',
  },
  {
    id: 'resources',
    label: 'Resources',
    href: '/resources',
    icon: FolderOpen,
    desktop: true,
    description: 'Course notes, exam archives & syllabus',
  },
  {
    id: 'qna',
    label: 'Q&A',
    href: '/q-and-a',
    icon: HelpCircle,
    desktop: true,
    description: 'Academic help & peer answers',
  },
  {
    id: 'leaderboard',
    label: 'Leaderboard',
    href: '/leaderboard',
    icon: Trophy,
    desktop: true,
    description: 'Top contributors & campus rankings',
  },
];

export const MOBILE_BOTTOM_NAV_ITEMS: {
  id: string;
  label: string;
  href: string;
  icon: LucideIcon;
  badgeKey?: 'notifications' | 'messages';
}[] = [
  { id: 'home', label: 'Home', href: '/feed', icon: Home },
  { id: 'explore', label: 'Feeds', href: '/explore', icon: Sparkles },
  { id: 'messages', label: 'Messages', href: '/messages', icon: MessageCircle, badgeKey: 'messages' },
  { id: 'search', label: 'Search', href: '/search', icon: Search },
  { id: 'profile', label: 'Profile', href: '/profile/me', icon: User },
];

export const SECONDARY_NAV_ITEMS: NavItem[] = [
  {
    id: 'notifications',
    label: 'Notifications',
    href: '/notifications',
    icon: Bell,
    badgeKey: 'notifications',
    desktop: true,
    description: 'Activity & mention alerts',
  },
  {
    id: 'messages',
    label: 'Messages',
    href: '/messages',
    icon: MessageCircle,
    badgeKey: 'messages',
    desktop: true,
    description: 'Direct & study group chats',
  },
  {
    id: 'settings',
    label: 'Settings',
    href: '/settings',
    icon: Settings,
    desktop: true,
    description: 'Account, privacy & preferences',
  },
];
