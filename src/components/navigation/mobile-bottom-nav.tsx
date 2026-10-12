"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { useUser } from "@/lib/auth/client";
import { useQuery, api } from "@/lib/api";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  MOBILE_NAV,
  PROFILE_HREF,
  getNavItem,
  isNavItemActive,
  isProfileActive,
} from "./nav-config";

/** True while the on-screen keyboard is likely open (visual viewport shrank). */
function useKeyboardOpen(): boolean {
  const [open, setOpen] = useState(false);
  useEffect(() => {
    const vv = window.visualViewport;
    if (!vv) return;
    const update = () => setOpen(window.innerHeight - vv.height > 150);
    update();
    vv.addEventListener("resize", update);
    return () => vv.removeEventListener("resize", update);
  }, []);
  return open;
}

export function MobileBottomNav() {
  const pathname = usePathname();
  const { user, isSignedIn } = useUser();
  const keyboardOpen = useKeyboardOpen();

  const unreadMessages = useQuery(
    api.conversations.getTotalUnreadCount,
    isSignedIn ? {} : "skip"
  );
  const unread = typeof unreadMessages === "number" ? unreadMessages : 0;

  if (keyboardOpen) return null;

  const items = MOBILE_NAV.map(({ itemId, label }) => {
    if (itemId === "profile") {
      return {
        id: "profile",
        label,
        href: PROFILE_HREF,
        active: isProfileActive(pathname, user?.id),
        Icon: null,
        badge: 0,
      };
    }
    const item = getNavItem(itemId);
    return {
      id: item.id,
      label,
      href: item.href,
      active: isNavItemActive(item, pathname),
      Icon: item.icon,
      badge: item.badge === "messages" ? unread : 0,
    };
  });

  return (
    <div
      className="md:hidden fixed inset-x-0 z-50 flex justify-center px-4 pointer-events-none"
      style={{ bottom: "calc(env(safe-area-inset-bottom, 0px) + 12px)" }}
    >
      <nav
        aria-label="Primary"
        className="pointer-events-auto flex items-center justify-between w-full max-w-sm h-14 px-2 rounded-full border border-border bg-background/90 backdrop-blur-xl shadow-lg"
      >
        {items.map(({ id, label, href, active, Icon, badge }) => (
          <Link
            key={id}
            href={href}
            aria-label={badge > 0 ? `${label}, ${badge} unread` : label}
            aria-current={active ? "page" : undefined}
            className={cn(
              "relative flex items-center justify-center h-11 w-11 rounded-full transition-colors motion-reduce:transition-none",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary",
              active ? "bg-primary/10 text-primary" : "text-foreground/70 active:bg-muted"
            )}
          >
            {Icon ? (
              <Icon className={cn("h-6 w-6", active ? "stroke-[2.25px]" : "stroke-[1.8]")} aria-hidden="true" />
            ) : (
              <Avatar
                className={cn(
                  "h-7 w-7",
                  active ? "ring-2 ring-primary ring-offset-2 ring-offset-background" : "border border-border"
                )}
              >
                <AvatarImage src={user?.profilePicture} alt="" />
                <AvatarFallback className="text-micro bg-muted font-bold text-foreground">
                  {user?.name?.substring(0, 2).toUpperCase() || "CC"}
                </AvatarFallback>
              </Avatar>
            )}
            {badge > 0 && (
              <span
                aria-hidden="true"
                className="absolute top-0.5 right-0.5 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-critical px-1 text-micro font-bold text-white ring-1 ring-background"
              >
                {badge > 99 ? "99+" : badge}
              </span>
            )}
          </Link>
        ))}
      </nav>
    </div>
  );
}
