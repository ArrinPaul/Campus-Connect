"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { useUser } from "@/lib/auth/client";
import { useQuery } from "@/lib/api";
import { api } from "@/lib/api";
import {
  Home,
  Sparkles,
  MessageCircle,
  Search,
  User,
} from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

export function MobileBottomNav() {
  const pathname = usePathname();
  const { user, isSignedIn } = useUser();

  const unreadMessages = useQuery(
    api.conversations.getTotalUnreadCount,
    isSignedIn ? {} : "skip"
  );

  const items = [
    {
      id: "home",
      label: "Home",
      href: "/feed",
      icon: Home,
      isActive: pathname === "/" || pathname === "/feed",
    },
    {
      id: "feeds",
      label: "Feeds",
      href: "/explore",
      icon: Sparkles,
      isActive: pathname?.startsWith("/explore") || pathname?.startsWith("/hashtag"),
    },
    {
      id: "messages",
      label: "Messages",
      href: "/messages",
      icon: MessageCircle,
      badge: typeof unreadMessages === "number" ? unreadMessages : 0,
      isActive: pathname?.startsWith("/messages"),
    },
    {
      id: "search",
      label: "Search",
      href: "/search",
      icon: Search,
      isActive: pathname?.startsWith("/search"),
    },
    {
      id: "profile",
      label: "Profile",
      href: "/profile/me",
      icon: User,
      isProfile: true,
      isActive: pathname?.startsWith("/profile"),
    },
  ];

  return (
    <div className="md:hidden fixed bottom-3 inset-x-0 z-50 flex justify-center pointer-events-none px-4 pb-safe">
      <nav
        className="pointer-events-auto flex items-center justify-between gap-1 px-3 py-2 bg-card/90 dark:bg-card/95 backdrop-blur-xl border border-border/80 shadow-float rounded-full max-w-[380px] w-full transition-transform active:scale-[0.99]"
        aria-label="Mobile Bottom Navigation"
      >
        {items.map((item) => {
          const active = item.isActive;

          return (
            <Link
              key={item.id}
              href={item.href}
              className={cn(
                "relative flex items-center justify-center h-12 w-12 rounded-full transition-all duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary",
                active
                  ? "bg-primary text-on-primary shadow-md shadow-primary/25 scale-105"
                  : "text-foreground/70 hover:text-foreground hover:bg-muted/60 active:scale-95"
              )}
              aria-label={item.label}
              aria-current={active ? "page" : undefined}
            >
              {item.isProfile && user?.profilePicture ? (
                <div className="relative flex items-center justify-center">
                  <Avatar
                    className={cn(
                      "h-7 w-7 transition-all border",
                      active ? "border-on-primary ring-2 ring-white/50" : "border-border"
                    )}
                  >
                    <AvatarImage src={user.profilePicture} alt={user.name} />
                    <AvatarFallback className="text-[10px] bg-primary text-on-primary font-bold">
                      {user.name?.substring(0, 2).toUpperCase() || "ME"}
                    </AvatarFallback>
                  </Avatar>
                </div>
              ) : (
                <div className="relative flex items-center justify-center">
                  <item.icon
                    className={cn(
                      "h-5 w-5 transition-transform",
                      active ? "stroke-[2.5px] scale-105" : "stroke-2"
                    )}
                  />
                  {item.badge !== undefined && item.badge > 0 && (
                    <span className="absolute -top-1.5 -right-1.5 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-critical px-1 text-[10px] font-black text-white shadow-sm border border-card">
                      {item.badge > 99 ? "99+" : item.badge}
                    </span>
                  )}
                </div>
              )}
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
