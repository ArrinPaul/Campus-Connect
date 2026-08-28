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
  Search,
  PlusSquare,
  MessageCircle,
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
      id: "search",
      label: "Search",
      href: "/explore",
      icon: Search,
      isActive: pathname?.startsWith("/explore") || pathname?.startsWith("/search"),
    },
    {
      id: "create",
      label: "Create",
      href: "/feed#create",
      icon: PlusSquare,
      isActive: false,
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
      id: "profile",
      label: "Profile",
      href: "/profile/me",
      icon: User,
      isProfile: true,
      isActive: pathname?.startsWith("/profile"),
    },
  ];

  return (
    <div className="md:hidden fixed bottom-0 inset-x-0 z-50 bg-background/95 dark:bg-black/95 backdrop-blur-xl border-t border-border pb-safe">
      <nav
        className="flex items-center justify-around h-[49px] w-full px-2"
        aria-label="Instagram Mobile Tab Bar"
      >
        {items.map((item) => {
          const active = item.isActive;

          return (
            <Link
              key={item.id}
              href={item.href}
              className={cn(
                "relative flex items-center justify-center h-11 w-11 rounded-lg transition-transform active:scale-90 text-foreground focus:outline-none",
                active ? "opacity-100" : "opacity-75 hover:opacity-100"
              )}
              aria-label={item.label}
              aria-current={active ? "page" : undefined}
            >
              {item.isProfile ? (
                <div className="relative flex items-center justify-center">
                  <Avatar
                    className={cn(
                      "h-6 w-6 transition-all",
                      active
                        ? "ring-2 ring-foreground ring-offset-2 ring-offset-background"
                        : "border border-border"
                    )}
                  >
                    <AvatarImage src={user?.profilePicture} alt={user?.name || "Profile"} />
                    <AvatarFallback className="text-[9px] bg-muted font-bold text-foreground">
                      {user?.name?.substring(0, 2).toUpperCase() || "CC"}
                    </AvatarFallback>
                  </Avatar>
                </div>
              ) : (
                <div className="relative flex items-center justify-center">
                  <item.icon
                    className={cn(
                      "h-[24px] w-[24px] transition-all",
                      active ? "stroke-[2.5px] fill-foreground/10 text-foreground" : "stroke-[1.8] text-foreground"
                    )}
                  />
                  {item.badge !== undefined && item.badge > 0 && (
                    <span className="absolute -top-1 -right-1 flex h-3.5 min-w-[14px] items-center justify-center rounded-full bg-[#ED4956] px-1 text-[8px] font-black text-white ring-1 ring-background">
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
