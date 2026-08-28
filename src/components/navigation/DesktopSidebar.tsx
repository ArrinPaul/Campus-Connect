"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { useUser, useAuthActions } from "@/lib/auth/client";
import { useQuery } from "@/lib/api";
import { api } from "@/lib/api";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  MAIN_NAV_ITEMS,
  SECONDARY_NAV_ITEMS,
  NavItem,
} from "@/lib/navigation-config";
import {
  ChevronLeft,
  ChevronRight,
  LogOut,
  Moon,
  Sun,
  Sparkles,
  ShieldCheck,
} from "lucide-react";
import { useTheme } from "next-themes";

interface DesktopSidebarProps {
  isCollapsed?: boolean;
  onToggleCollapse?: () => void;
}

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

  // Sync state with localStorage if uncontrolled
  useEffect(() => {
    setMounted(true);
    const saved = localStorage.getItem("cc_sidebar_collapsed");
    if (saved !== null) {
      setInternalCollapsed(saved === "true");
    }
  }, []);

  const isCollapsed =
    controlledCollapsed !== undefined
      ? controlledCollapsed
      : internalCollapsed;

  const toggleCollapse = () => {
    if (onToggleCollapse) {
      onToggleCollapse();
    } else {
      const next = !internalCollapsed;
      setInternalCollapsed(next);
      localStorage.setItem("cc_sidebar_collapsed", String(next));
      window.dispatchEvent(new Event("cc_sidebar_resize"));
    }
  };

  // Queries for badges
  const unreadNotifications = useQuery(
    api.notifications.getUnreadCount,
    isSignedIn ? {} : "skip"
  );
  const unreadMessages = useQuery(
    api.conversations.getTotalUnreadCount,
    isSignedIn ? {} : "skip"
  );

  const isActive = (item: NavItem) => {
    if (item.exact) {
      return pathname === item.href;
    }
    return pathname === item.href || pathname?.startsWith(item.href + "/");
  };

  const getBadgeCount = (key?: "notifications" | "messages") => {
    if (key === "notifications" && typeof unreadNotifications === "number") {
      return unreadNotifications;
    }
    if (key === "messages" && typeof unreadMessages === "number") {
      return unreadMessages;
    }
    return 0;
  };

  // Profile data for AR / Arrin area
  const displayName = user?.name || "Arrin";
  const displayInitials =
    user?.name
      ?.split(" ")
      .map((n) => n[0])
      .join("")
      .substring(0, 2)
      .toUpperCase() || "AR";
  const displayUsername = (user as any)?.username
    ? `@${(user as any).username}`
    : "@arrin";

  return (
    <TooltipProvider delayDuration={150}>
      <aside
        className={cn(
          "flex flex-col h-full bg-card border-r border-border transition-all duration-300 select-none z-30",
          isCollapsed ? "w-[72px]" : "w-[260px]"
        )}
        aria-label="Sidebar Navigation"
      >
        {/* Top Brand Header & Collapse Toggle */}
        <div className="flex items-center justify-between px-3.5 py-4 border-b border-border/50 shrink-0">
          <Link
            href="/feed"
            className="flex items-center gap-3 group/logo focus:outline-none focus-visible:ring-2 focus-visible:ring-primary rounded-xl"
          >
            <div className="h-10 w-10 shrink-0 rounded-2xl bg-gradient-to-tr from-primary to-blue-500 flex items-center justify-center shadow-md shadow-primary/20 text-white font-black text-sm tracking-wider transition-transform group-hover/logo:scale-105">
              CC
            </div>
            {!isCollapsed && (
              <div className="flex flex-col overflow-hidden">
                <span className="text-base font-bold text-foreground tracking-tight whitespace-nowrap">
                  Campus Connect
                </span>
                <span className="text-[11px] font-medium text-muted-foreground flex items-center gap-1">
                  <Sparkles className="w-3 h-3 text-amber-500 fill-amber-500" /> Academic Network
                </span>
              </div>
            )}
          </Link>

          <button
            onClick={toggleCollapse}
            className={cn(
              "h-8 w-8 rounded-lg flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-primary",
              isCollapsed && "mx-auto mt-1"
            )}
            aria-label={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
            title={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
          >
            {isCollapsed ? (
              <ChevronRight className="h-4 w-4" />
            ) : (
              <ChevronLeft className="h-4 w-4" />
            )}
          </button>
        </div>

        {/* AR / Arrin Profile Area */}
        <div className="px-2.5 py-3 border-b border-border/50 shrink-0">
          {isCollapsed ? (
            <Tooltip>
              <TooltipTrigger asChild>
                <Link
                  href="/profile/me"
                  className={cn(
                    "relative flex items-center justify-center w-11 h-11 mx-auto rounded-xl transition-all",
                    pathname?.startsWith("/profile/me")
                      ? "ring-2 ring-primary ring-offset-2 bg-primary/10"
                      : "hover:bg-muted"
                  )}
                  aria-label="Your Profile"
                >
                  <Avatar className="h-9 w-9 border border-border shadow-sm">
                    <AvatarImage src={user?.profilePicture} alt={displayName} />
                    <AvatarFallback className="bg-primary text-on-primary text-xs font-bold">
                      {displayInitials}
                    </AvatarFallback>
                  </Avatar>
                  <span className="absolute bottom-1 right-1 w-2.5 h-2.5 bg-emerald-500 border-2 border-card rounded-full" />
                </Link>
              </TooltipTrigger>
              <TooltipContent side="right" sideOffset={10}>
                <p className="font-semibold text-xs">{displayName}</p>
                <p className="text-[11px] text-muted-foreground">{displayUsername}</p>
              </TooltipContent>
            </Tooltip>
          ) : (
            <Link
              href="/profile/me"
              className={cn(
                "flex items-center gap-3 p-2 rounded-xl transition-all group",
                pathname?.startsWith("/profile/me")
                  ? "bg-primary-soft text-primary font-semibold"
                  : "hover:bg-muted text-foreground"
              )}
            >
              <div className="relative shrink-0">
                <Avatar className="h-10 w-10 border border-border shadow-sm group-hover:scale-105 transition-transform">
                  <AvatarImage src={user?.profilePicture} alt={displayName} />
                  <AvatarFallback className="bg-primary text-on-primary text-xs font-bold">
                    {displayInitials}
                  </AvatarFallback>
                </Avatar>
                <span className="absolute bottom-0 right-0 w-3 h-3 bg-emerald-500 border-2 border-card rounded-full" />
              </div>
              <div className="flex flex-col min-w-0 flex-1">
                <span className="text-sm font-semibold truncate text-foreground flex items-center gap-1">
                  {displayName}
                  <ShieldCheck className="w-3.5 h-3.5 text-primary shrink-0" />
                </span>
                <span className="text-xs text-muted-foreground truncate">
                  {displayUsername}
                </span>
              </div>
            </Link>
          )}
        </div>

        {/* Scrollable Navigation List */}
        <div className="flex-1 overflow-y-auto px-2.5 py-3 space-y-6 scrollbar-none">
          {/* Main Primary Links */}
          <nav className="space-y-1">
            {MAIN_NAV_ITEMS.map((item) => {
              const active = isActive(item);
              const badge = getBadgeCount(item.badgeKey);

              const navLinkContent = (
                <Link
                  key={item.id}
                  href={item.href}
                  className={cn(
                    "flex items-center gap-3.5 px-3 py-2.5 rounded-xl transition-all relative font-medium group",
                    active
                      ? "bg-primary text-on-primary shadow-sm shadow-primary/20 font-semibold"
                      : "text-foreground/80 hover:text-foreground hover:bg-muted/80",
                    isCollapsed && "justify-center px-0 w-11 h-11 mx-auto"
                  )}
                  aria-current={active ? "page" : undefined}
                >
                  <div className="relative shrink-0 flex items-center justify-center">
                    <item.icon
                      className={cn(
                        "h-5 w-5 transition-transform group-hover:scale-110",
                        active ? "text-on-primary stroke-[2.5px]" : "text-muted-foreground group-hover:text-foreground stroke-2"
                      )}
                    />
                    {badge > 0 && isCollapsed && (
                      <span className="absolute -top-1 -right-1.5 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-critical px-1 text-[10px] font-bold text-white shadow-sm">
                        {badge > 99 ? "99+" : badge}
                      </span>
                    )}
                  </div>

                  {!isCollapsed && (
                    <>
                      <span className="text-sm truncate flex-1">{item.label}</span>
                      {badge > 0 && (
                        <span className={cn(
                          "px-2 py-0.5 text-xs font-bold rounded-full",
                          active ? "bg-white/20 text-white" : "bg-primary/10 text-primary"
                        )}>
                          {badge > 99 ? "99+" : badge}
                        </span>
                      )}
                    </>
                  )}
                </Link>
              );

              if (isCollapsed) {
                return (
                  <Tooltip key={item.id}>
                    <TooltipTrigger asChild>{navLinkContent}</TooltipTrigger>
                    <TooltipContent side="right" sideOffset={10}>
                      <p className="font-semibold text-xs">{item.label}</p>
                      {item.description && (
                        <p className="text-[11px] text-muted-foreground">
                          {item.description}
                        </p>
                      )}
                    </TooltipContent>
                  </Tooltip>
                );
              }

              return navLinkContent;
            })}
          </nav>

          {/* Secondary Links: Alerts, Chats & Settings */}
          <div>
            {!isCollapsed && (
              <div className="px-3 mb-1.5 text-[11px] font-bold uppercase tracking-wider text-muted-foreground/70">
                System
              </div>
            )}
            <nav className="space-y-1">
              {SECONDARY_NAV_ITEMS.map((item) => {
                const active = isActive(item);
                const badge = getBadgeCount(item.badgeKey);

                const linkContent = (
                  <Link
                    key={item.id}
                    href={item.href}
                    className={cn(
                      "flex items-center gap-3.5 px-3 py-2.5 rounded-xl transition-all relative font-medium group",
                      active
                        ? "bg-primary text-on-primary shadow-sm shadow-primary/20 font-semibold"
                        : "text-foreground/80 hover:text-foreground hover:bg-muted/80",
                      isCollapsed && "justify-center px-0 w-11 h-11 mx-auto"
                    )}
                    aria-current={active ? "page" : undefined}
                  >
                    <div className="relative shrink-0 flex items-center justify-center">
                      <item.icon
                        className={cn(
                          "h-5 w-5 transition-transform group-hover:scale-110",
                          active ? "text-on-primary stroke-[2.5px]" : "text-muted-foreground group-hover:text-foreground stroke-2"
                        )}
                      />
                      {badge > 0 && isCollapsed && (
                        <span className="absolute -top-1 -right-1.5 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-critical px-1 text-[10px] font-bold text-white shadow-sm">
                          {badge > 99 ? "99+" : badge}
                        </span>
                      )}
                    </div>

                    {!isCollapsed && (
                      <>
                        <span className="text-sm truncate flex-1">{item.label}</span>
                        {badge > 0 && (
                          <span className={cn(
                            "px-2 py-0.5 text-xs font-bold rounded-full",
                            active ? "bg-white/20 text-white" : "bg-primary/10 text-primary"
                          )}>
                            {badge > 99 ? "99+" : badge}
                          </span>
                        )}
                      </>
                    )}
                  </Link>
                );

                if (isCollapsed) {
                  return (
                    <Tooltip key={item.id}>
                      <TooltipTrigger asChild>{linkContent}</TooltipTrigger>
                      <TooltipContent side="right" sideOffset={10}>
                        <p className="font-semibold text-xs">{item.label}</p>
                        {item.description && (
                          <p className="text-[11px] text-muted-foreground">
                            {item.description}
                          </p>
                        )}
                      </TooltipContent>
                    </Tooltip>
                  );
                }

                return linkContent;
              })}
            </nav>
          </div>
        </div>

        {/* Bottom Bar: Theme toggle & Sign out */}
        <div className="p-2.5 border-t border-border/50 flex flex-col gap-1 shrink-0 bg-card/50">
          {/* Theme switcher */}
          {mounted && (
            <button
              onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
              className={cn(
                "flex items-center gap-3 px-3 py-2 rounded-xl text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-muted transition-colors",
                isCollapsed && "justify-center px-0 w-11 h-11 mx-auto"
              )}
              aria-label="Toggle light/dark theme"
            >
              {theme === "dark" ? (
                <Sun className="h-5 w-5 text-amber-400" />
              ) : (
                <Moon className="h-5 w-5 text-indigo-500" />
              )}
              {!isCollapsed && (
                <span>{theme === "dark" ? "Light Mode" : "Dark Mode"}</span>
              )}
            </button>
          )}

          {/* Sign Out */}
          {isSignedIn && (
            <button
              onClick={() => signOut({ redirectUrl: "/" })}
              className={cn(
                "flex items-center gap-3 px-3 py-2 rounded-xl text-sm font-medium text-critical hover:bg-critical/10 transition-colors",
                isCollapsed && "justify-center px-0 w-11 h-11 mx-auto"
              )}
              aria-label="Sign out of Campus Connect"
            >
              <LogOut className="h-5 w-5" />
              {!isCollapsed && <span>Sign Out</span>}
            </button>
          )}
        </div>
      </aside>
    </TooltipProvider>
  );
}
