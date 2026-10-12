"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { useUser, useAuthActions } from "@/lib/auth/client";
import { useQuery, api } from "@/lib/api";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Menu,
  Moon,
  Sun,
  LogOut,
  PanelLeftClose,
  PanelLeftOpen,
} from "lucide-react";
import { useTheme } from "next-themes";
import {
  NAV_GROUP_LABELS,
  PROFILE_HREF,
  getSidebarItems,
  isNavItemActive,
  isProfileActive,
  type NavGroup,
  type NavItem,
} from "./nav-config";

interface DesktopSidebarProps {
  isCollapsed?: boolean;
  onToggleCollapse?: () => void;
}

interface CurrentUserRecord {
  name?: string | null;
  username?: string | null;
  profile_picture?: string | null;
  is_admin?: boolean | null;
  role?: string | null;
}

const GROUP_ORDER: NavGroup[] = ["core", "discover", "academic", "opportunities", "account"];

export function DesktopSidebar({
  isCollapsed: controlledCollapsed,
  onToggleCollapse,
}: DesktopSidebarProps) {
  const pathname = usePathname();
  const { user, isSignedIn } = useUser();
  const { signOut } = useAuthActions();
  const { theme, setTheme } = useTheme();

  const [internalCollapsed, setInternalCollapsed] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [showMoreMenu, setShowMoreMenu] = useState(false);
  const moreMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setMounted(true);
    const saved = localStorage.getItem("cc_sidebar_collapsed");
    if (saved !== null) {
      setInternalCollapsed(saved === "true");
    }

    const handleClickOutside = (event: MouseEvent) => {
      if (moreMenuRef.current && !moreMenuRef.current.contains(event.target as Node)) {
        setShowMoreMenu(false);
      }
    };
    const handleKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setShowMoreMenu(false);
    };

    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleKey);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleKey);
    };
  }, []);

  const isCollapsed =
    controlledCollapsed !== undefined ? controlledCollapsed : internalCollapsed;

  const handleToggle = () => {
    if (onToggleCollapse) {
      onToggleCollapse();
    } else {
      const next = !internalCollapsed;
      setInternalCollapsed(next);
      localStorage.setItem("cc_sidebar_collapsed", String(next));
    }
  };

  const unreadNotifications = useQuery(
    api.notifications.getUnreadCount,
    isSignedIn ? {} : "skip"
  );
  const totalUnreadMessages = useQuery(
    api.conversations.getTotalUnreadCount,
    isSignedIn ? {} : "skip"
  );
  const dbUser = useQuery(
    api.users.getCurrentUser,
    isSignedIn ? {} : "skip"
  ) as CurrentUserRecord | null | undefined;

  const isAdmin = !!dbUser && (dbUser.is_admin === true || dbUser.role === "admin");
  const items = getSidebarItems({ isAdmin });

  const displayName = dbUser?.name || user?.name || "Your profile";
  const handle = dbUser?.username ? `@${dbUser.username}` : user?.email ?? "";
  const avatarSrc = dbUser?.profile_picture || user?.profilePicture || undefined;
  const initials = displayName.substring(0, 2).toUpperCase();
  const profileActive = isProfileActive(pathname, user?.id);

  const badgeFor = (item: NavItem): number => {
    if (item.badge === "messages") return typeof totalUnreadMessages === "number" ? totalUnreadMessages : 0;
    if (item.badge === "notifications") return typeof unreadNotifications === "number" ? unreadNotifications : 0;
    return 0;
  };

  const withTooltip = (key: string, label: string, node: React.ReactElement) =>
    isCollapsed ? (
      <Tooltip key={key}>
        <TooltipTrigger asChild>{node}</TooltipTrigger>
        <TooltipContent side="right" sideOffset={12}>
          <p className="font-semibold text-xs">{label}</p>
        </TooltipContent>
      </Tooltip>
    ) : (
      node
    );

  const itemClass = (active: boolean) =>
    cn(
      "flex items-center gap-3 px-3 py-2 rounded-xl transition-colors motion-reduce:transition-none font-medium relative group",
      "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary",
      active
        ? "bg-primary/10 text-primary font-semibold"
        : "text-foreground/80 hover:bg-muted/60 hover:text-foreground",
      isCollapsed && "justify-center px-0 w-11 h-11 mx-auto"
    );

  const renderItem = (item: NavItem) => {
    const active = isNavItemActive(item, pathname);
    const count = badgeFor(item);
    const Icon = item.icon;
    const accessibleName = count > 0 ? `${item.label}, ${count} unread` : item.label;

    const node = (
      <Link
        key={item.id}
        href={item.href}
        className={itemClass(active)}
        aria-current={active ? "page" : undefined}
        aria-label={isCollapsed ? accessibleName : undefined}
      >
        <span className="relative shrink-0 flex items-center justify-center">
          <Icon className={cn("h-5 w-5", active ? "stroke-[2.25px]" : "stroke-[1.8]")} aria-hidden="true" />
          {count > 0 && (
            <span
              className="absolute -top-1.5 -right-2 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-critical px-1 text-micro font-bold text-white ring-1 ring-background"
              aria-hidden="true"
            >
              {count > 99 ? "99+" : count}
            </span>
          )}
        </span>
        {!isCollapsed && <span className="text-sm truncate">{item.label}</span>}
        {!isCollapsed && count > 0 && <span className="sr-only">{count} unread</span>}
      </Link>
    );

    return withTooltip(item.id, item.label, node);
  };

  const profileNode = (
    <Link
      href={PROFILE_HREF}
      className={cn(itemClass(profileActive), "gap-3", !isCollapsed && "py-2.5")}
      aria-current={profileActive ? "page" : undefined}
      aria-label={isCollapsed ? `Profile: ${displayName}` : undefined}
    >
      <Avatar className="h-8 w-8 shrink-0">
        <AvatarImage src={avatarSrc} alt="" />
        <AvatarFallback className="text-tiny bg-muted font-bold text-foreground">
          {initials}
        </AvatarFallback>
      </Avatar>
      {!isCollapsed && (
        <span className="min-w-0 flex flex-col leading-tight">
          <span className="text-sm font-semibold truncate">{displayName}</span>
          {handle && <span className="text-xs text-muted-foreground truncate">{handle}</span>}
        </span>
      )}
    </Link>
  );

  return (
    <TooltipProvider delayDuration={150}>
      <aside
        className={cn(
          "flex flex-col h-full bg-background border-r border-border transition-[width] duration-200 motion-reduce:transition-none z-30 px-3 py-4 relative",
          isCollapsed ? "w-[72px]" : "w-[232px] xl:w-[260px]"
        )}
        aria-label="Primary"
      >
        {/* Brand + collapse toggle */}
        <div
          className={cn(
            "flex items-center pb-3 shrink-0",
            isCollapsed ? "flex-col gap-2" : "justify-between px-2"
          )}
        >
          <Link
            href="/feed"
            className="font-bold tracking-tight text-foreground rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
            aria-label="Campus Connect home"
          >
            {isCollapsed ? <span className="text-xl font-black">CC</span> : <span className="text-xl">Campus Connect</span>}
          </Link>
          <button
            type="button"
            onClick={handleToggle}
            className="h-8 w-8 flex items-center justify-center rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
            aria-label={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
            aria-pressed={isCollapsed}
          >
            {isCollapsed ? <PanelLeftOpen className="h-4 w-4" /> : <PanelLeftClose className="h-4 w-4" />}
          </button>
        </div>

        {/* Identity */}
        {isSignedIn && (
          <div className="shrink-0 pb-2">{withTooltip("profile", displayName, profileNode)}</div>
        )}

        {/* Navigation (scrolls when the viewport is short) */}
        <nav className="flex-1 min-h-0 overflow-y-auto no-scrollbar flex flex-col gap-0.5" aria-label="Main navigation">
          {GROUP_ORDER.map((group) => {
            const groupItems = items.filter((i) => i.group === group);
            if (groupItems.length === 0) return null;
            return (
              <div key={group} className="flex flex-col gap-0.5 pt-2">
                {isCollapsed ? (
                  group !== "core" && <div className="mx-3 mb-1 border-t border-border" aria-hidden="true" />
                ) : (
                  group !== "core" && (
                    <p className="px-3 pb-1 text-tiny font-semibold uppercase tracking-wider text-muted-foreground">
                      {NAV_GROUP_LABELS[group]}
                    </p>
                  )
                )}
                {groupItems.map(renderItem)}
              </div>
            );
          })}
        </nav>

        {/* More: appearance and sign out */}
        <div className="relative pt-2 shrink-0" ref={moreMenuRef}>
          {showMoreMenu && (
            <div
              className="absolute bottom-full mb-2 left-0 w-60 bg-card border border-border rounded-2xl shadow-lg p-1.5 z-50"
              role="menu"
            >
              {mounted && (
                <button
                  type="button"
                  role="menuitem"
                  onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
                  className="w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-sm font-medium text-foreground hover:bg-muted transition-colors text-left"
                >
                  <span className="flex items-center gap-3">
                    {theme === "dark" ? <Moon className="h-4 w-4" /> : <Sun className="h-4 w-4" />}
                    Switch appearance
                  </span>
                  <span className="text-xs text-muted-foreground">{theme === "dark" ? "Dark" : "Light"}</span>
                </button>
              )}
              {isSignedIn && (
                <button
                  type="button"
                  role="menuitem"
                  onClick={() => signOut({ redirectUrl: "/" })}
                  className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-critical hover:bg-critical/10 transition-colors text-left"
                >
                  <LogOut className="h-4 w-4" />
                  Log out
                </button>
              )}
            </div>
          )}

          {withTooltip(
            "more",
            "More",
            <button
              type="button"
              onClick={() => setShowMoreMenu((prev) => !prev)}
              className={cn(itemClass(showMoreMenu), "w-full cursor-pointer")}
              aria-label="More options"
              aria-expanded={showMoreMenu}
              aria-haspopup="menu"
            >
              <Menu className="h-5 w-5 stroke-[1.8]" aria-hidden="true" />
              {!isCollapsed && <span className="text-sm">More</span>}
            </button>
          )}
        </div>
      </aside>
    </TooltipProvider>
  );
}
