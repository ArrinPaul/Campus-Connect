import {
  Home,
  Search,
  Compass,
  Send,
  Heart,
  PlusSquare,
  Users,
  Store,
  Briefcase,
  BookOpen,
  Library,
  CircleHelp,
  Trophy,
  Layers,
  Calendar,
  Bookmark,
  Settings,
  ShieldCheck,
  type LucideIcon,
} from "lucide-react";

/**
 * Single source of truth for app navigation. Consumed by the desktop sidebar
 * and the mobile bottom bar. Every `href` must resolve to a real page under
 * `src/app/(dashboard)`; nav-config.test.ts enforces this against the file tree.
 */

export type NavBadge = "messages" | "notifications";
export type NavGroup = "core" | "discover" | "academic" | "opportunities" | "account";

export interface NavItem {
  id: string;
  label: string;
  href: string;
  icon: LucideIcon;
  group: NavGroup;
  /** Path prefixes (besides `href`) that should mark this item active. */
  matchPrefixes?: string[];
  /** Active only on exactly these paths (used where a prefix would over-match). */
  exactPaths?: string[];
  badge?: NavBadge;
  /** Shown only when the signed-in user is an admin. */
  requiresAdmin?: boolean;
  /** Not a destination: opens an in-page action (never shows an active state). */
  action?: boolean;
}

export const NAV_ITEMS: readonly NavItem[] = [
  { id: "home", label: "Home", href: "/feed", icon: Home, group: "core", exactPaths: ["/", "/feed"] },
  { id: "search", label: "Search", href: "/search", icon: Search, group: "core", matchPrefixes: ["/search"] },
  { id: "explore", label: "Explore", href: "/explore", icon: Compass, group: "discover", matchPrefixes: ["/explore", "/hashtag"] },
  { id: "messages", label: "Messages", href: "/messages", icon: Send, group: "core", matchPrefixes: ["/messages"], badge: "messages" },
  { id: "notifications", label: "Notifications", href: "/notifications", icon: Heart, group: "core", matchPrefixes: ["/notifications"], badge: "notifications" },
  { id: "create", label: "Create", href: "/feed#create", icon: PlusSquare, group: "core", action: true },
  { id: "stories", label: "Stories", href: "/stories", icon: Layers, group: "discover", matchPrefixes: ["/stories"] },
  { id: "bookmarks", label: "Saved", href: "/bookmarks", icon: Bookmark, group: "discover", matchPrefixes: ["/bookmarks"] },
  { id: "groups", label: "Groups", href: "/communities", icon: Users, group: "discover", matchPrefixes: ["/communities", "/c/"] },
  { id: "events", label: "Events", href: "/events", icon: Calendar, group: "discover", matchPrefixes: ["/events"] },
  { id: "jobs", label: "Jobs", href: "/jobs", icon: Briefcase, group: "opportunities", matchPrefixes: ["/jobs"] },
  { id: "marketplace", label: "Marketplace", href: "/marketplace", icon: Store, group: "opportunities", matchPrefixes: ["/marketplace"] },
  { id: "research", label: "Research", href: "/research", icon: BookOpen, group: "academic", matchPrefixes: ["/research"] },
  { id: "resources", label: "Resources", href: "/resources", icon: Library, group: "academic", matchPrefixes: ["/resources"] },
  { id: "qa", label: "Q&A", href: "/q-and-a", icon: CircleHelp, group: "academic", matchPrefixes: ["/q-and-a"] },
  { id: "leaderboard", label: "Leaderboard", href: "/leaderboard", icon: Trophy, group: "academic", matchPrefixes: ["/leaderboard"] },
  { id: "settings", label: "Settings", href: "/settings", icon: Settings, group: "account", matchPrefixes: ["/settings"] },
  { id: "admin", label: "Admin", href: "/admin/dashboard", icon: ShieldCheck, group: "account", matchPrefixes: ["/admin"], requiresAdmin: true },
];

export const NAV_GROUP_LABELS: Record<NavGroup, string> = {
  core: "Main",
  discover: "Discover",
  academic: "Academic",
  opportunities: "Opportunities",
  account: "Account",
};

export const PROFILE_HREF = "/profile/me";

/**
 * The five icon-only slots of the mobile bottom bar, in order. `Home` and
 * `Feeds` are distinct destinations: the home feed (/feed) and stories
 * (/stories). Search points at the real search page, not Explore.
 */
export const MOBILE_NAV: readonly { itemId: string; label: string }[] = [
  { itemId: "home", label: "Home" },
  { itemId: "stories", label: "Feeds" },
  { itemId: "messages", label: "Messages" },
  { itemId: "search", label: "Search" },
  { itemId: "profile", label: "Profile" },
];

export function getNavItem(id: string): NavItem {
  const item = NAV_ITEMS.find((i) => i.id === id);
  if (!item) throw new Error(`Unknown nav item: ${id}`);
  return item;
}

/** Items shown in the desktop sidebar's main stack, in order. */
export function getSidebarItems(opts: { isAdmin?: boolean } = {}): NavItem[] {
  return NAV_ITEMS.filter((i) => !i.requiresAdmin || opts.isAdmin);
}

/** Strip query/hash so `/feed#create` can be compared with pathnames. */
function pathOf(href: string): string {
  return href.split("#")[0].split("?")[0];
}

export function isNavItemActive(item: NavItem, pathname: string | null | undefined): boolean {
  if (!pathname || item.action) return false;
  if (item.exactPaths) return item.exactPaths.includes(pathname);
  const prefixes = item.matchPrefixes ?? [pathOf(item.href)];
  return prefixes.some((p) =>
    p.endsWith("/") ? pathname.startsWith(p) : pathname === p || pathname.startsWith(`${p}/`)
  );
}

/**
 * The profile item is active on /profile/me and on the signed-in user's own
 * profile, but not when browsing someone else's.
 */
export function isProfileActive(pathname: string | null | undefined, userId?: string | null): boolean {
  if (!pathname) return false;
  if (pathname === PROFILE_HREF || pathname.startsWith(`${PROFILE_HREF}/`)) return true;
  return !!userId && (pathname === `/profile/${userId}` || pathname.startsWith(`/profile/${userId}/`));
}
