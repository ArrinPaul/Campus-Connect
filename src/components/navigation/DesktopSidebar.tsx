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
  Home,
  Search,
  Compass,
  Send,
  Heart,
  PlusSquare,
  Users,
  Bookmark,
  Menu,
  Moon,
  Sun,
  LogOut,
  Settings,
  Sparkles,
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
  const [showMoreMenu, setShowMoreMenu] = useState(false);

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

  // Unread notifications & messages
  const unreadNotifications = useQuery(
    api.notifications.getUnreadCount,
    isSignedIn ? {} : "skip"
  );
  const unreadMessages = useQuery(
    api.conversations.getTotalUnreadCount,
    isSignedIn ? {} : "skip"
  );

  const navItems = [
    {
      id: "home",
      label: "Home",
      href: "/feed",
      icon: Home,
      isActive: pathname === "/" || pathname === "/feed",
    },
    {
      id: "search",
      label: "Search",
      href: "/search",
      icon: Search,
      isActive: pathname?.startsWith("/search"),
    },
    {
      id: "explore",
      label: "Explore",
      href: "/explore",
      icon: Compass,
      isActive: pathname?.startsWith("/explore") || pathname?.startsWith("/hashtag"),
    },
    {
      id: "messages",
      label: "Messages",
      href: "/messages",
      icon: Send,
      badge: typeof unreadMessages === "number" ? unreadMessages : 0,
      iconClass: "-rotate-12",
      isActive: pathname?.startsWith("/messages"),
    },
    {
      id: "notifications",
      label: "Notifications",
      href: "/notifications",
      icon: Heart,
      badge: typeof unreadNotifications === "number" ? unreadNotifications : 0,
      isActive: pathname?.startsWith("/notifications"),
    },
    {
      id: "create",
      label: "Create",
      href: "/feed#create",
      icon: PlusSquare,
      isActive: false,
    },
    {
      id: "communities",
      label: "Communities",
      href: "/communities",
      icon: Users,
      isActive: pathname?.startsWith("/communities"),
    },
    {
      id: "bookmarks",
      label: "Saved",
      href: "/bookmarks",
      icon: Bookmark,
      isActive: pathname?.startsWith("/bookmarks"),
    },
    {
      id: "profile",
      label: "Profile",
      href: "/profile/me",
      isProfile: true,
      isActive: pathname?.startsWith("/profile"),
    },
  ];

  return (
    <TooltipProvider delayDuration={150}>
      <aside
        className={cn(
          "flex flex-col h-full bg-background dark:bg-black border-r border-border transition-all duration-200 select-none z-30 px-3 py-5 justify-between",
          isCollapsed ? "w-[72px]" : "w-[245px] xl:w-[260px]"
        )}
        aria-label="Instagram Style Desktop Sidebar"
      >
        {/* Top Header / Brand Logo */}
        <div className="flex flex-col gap-6">
          <div className="px-3 pt-2">
            <Link
              href="/feed"
              className="flex items-center gap-3 active:scale-95 transition-transform"
            >
              {isCollapsed ? (
                <span className="text-[20px] font-black tracking-tight text-foreground font-sans">
                  CC
                </span>
              ) : (
                <span className="text-[22px] font-bold tracking-tight text-foreground font-sans">
                  Campus Connect
                </span>
              )}
            </Link>
          </div>

          {/* Navigation Item Stack */}
          <nav className="flex flex-col gap-1.5">
            {navItems.map((item) => {
              const active = item.isActive;

              const linkNode = (
                <Link
                  key={item.id}
                  href={item.href}
                  className={cn(
                    "flex items-center gap-4 px-3 py-3 rounded-xl transition-all font-medium text-foreground relative group",
                    active ? "font-bold" : "hover:bg-muted/60 text-foreground/80 hover:text-foreground",
                    isCollapsed && "justify-center px-0 w-12 h-12 mx-auto"
                  )}
                  aria-current={active ? "page" : undefined}
                >
                  {item.isProfile ? (
                    <div className="relative shrink-0 flex items-center justify-center">
                      <Avatar
                        className={cn(
                          "h-6 w-6 transition-all",
                          active
                            ? "ring-2 ring-foreground ring-offset-2 ring-offset-background"
                            : "border border-border"
                        )}
                      >
                        <AvatarImage src={user?.profilePicture} alt={user?.name || "Profile"} />
                        <AvatarFallback className="text-[10px] bg-muted font-bold text-foreground">
                          {user?.name?.substring(0, 2).toUpperCase() || "CC"}
                        </AvatarFallback>
                      </Avatar>
                    </div>
                  ) : (
                    <div className="relative shrink-0 flex items-center justify-center">
                      {item.icon && (
                        <item.icon
                          className={cn(
                            "h-[22px] w-[22px] transition-transform group-hover:scale-105",
                            active ? "stroke-[2.5px] text-foreground" : "stroke-[1.8] text-foreground",
                            item.iconClass
                          )}
                        />
                      )}
                      {item.badge !== undefined && item.badge > 0 && (
                        <span className="absolute -top-1 -right-1.5 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-[#ED4956] px-1 text-[9px] font-bold text-white ring-1 ring-background">
                          {item.badge > 99 ? "99+" : item.badge}
                        </span>
                      )}
                    </div>
                  )}

                  {!isCollapsed && (
                    <span className={cn("text-[15px] tracking-tight", active ? "font-bold text-foreground" : "text-foreground")}>
                      {item.label}
                    </span>
                  )}
                </Link>
              );

              if (isCollapsed) {
                return (
                  <Tooltip key={item.id}>
                    <TooltipTrigger asChild>{linkNode}</TooltipTrigger>
                    <TooltipContent side="right" sideOffset={12}>
                      <p className="font-semibold text-xs">{item.label}</p>
                    </TooltipContent>
                  </Tooltip>
                );
              }

              return linkNode;
            })}
          </nav>
        </div>

        {/* Bottom Menu / More Options */}
        <div className="relative pt-2">
          {showMoreMenu && (
            <div className="absolute bottom-14 left-0 w-56 bg-card border border-border rounded-2xl shadow-xl p-1.5 z-50 animate-in fade-in slide-in-from-bottom-2 duration-150">
              <Link
                href="/settings"
                onClick={() => setShowMoreMenu(false)}
                className="flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium text-foreground hover:bg-muted transition-colors"
              >
                <Settings className="h-4 w-4" />
                <span>Settings</span>
              </Link>

              {mounted && (
                <button
                  onClick={() => {
                    setTheme(theme === "dark" ? "light" : "dark");
                    setShowMoreMenu(false);
                  }}
                  className="w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium text-foreground hover:bg-muted transition-colors text-left"
                >
                  {theme === "dark" ? (
                    <>
                      <Sun className="h-4 w-4 text-amber-500" />
                      <span>Light Mode</span>
                    </>
                  ) : (
                    <>
                      <Moon className="h-4 w-4 text-indigo-500" />
                      <span>Dark Mode</span>
                    </>
                  )}
                </button>
              )}

              {isSignedIn && (
                <button
                  onClick={() => signOut({ redirectUrl: "/" })}
                  className="w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium text-[#ED4956] hover:bg-rose-500/10 transition-colors text-left border-t border-border mt-1 pt-2"
                >
                  <LogOut className="h-4 w-4" />
                  <span>Log Out</span>
                </button>
              )}
            </div>
          )}

          <button
            onClick={() => setShowMoreMenu(!showMoreMenu)}
            className={cn(
              "flex items-center gap-4 px-3 py-3 rounded-xl transition-all font-medium text-foreground hover:bg-muted/60 w-full group focus:outline-none",
              isCollapsed && "justify-center px-0 w-12 h-12 mx-auto"
            )}
            aria-label="More options"
          >
            <Menu className="h-[22px] w-[22px] stroke-[1.8] text-foreground group-hover:scale-105 transition-transform" />
            {!isCollapsed && <span className="text-[15px] font-medium">More</span>}
          </button>
        </div>
      </aside>
    </TooltipProvider>
  );
}
