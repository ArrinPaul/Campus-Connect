"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { useQuery } from "convex/react"
import { api } from "@/convex/_generated/api"
import { Home, Compass, MessageSquare, Bell, User } from "lucide-react"
import { cn } from "@/lib/utils"

const TABS = [
  { label: "Feed", href: "/feed", icon: Home },
  { label: "Discover", href: "/discover", icon: Compass },
  { label: "Messages", href: "/messages", icon: MessageSquare },
  { label: "Alerts", href: "/notifications", icon: Bell },
  { label: "Profile", href: "/profile", icon: User },
] as const

interface BottomNavProps {
  currentUserId?: string
}

export function BottomNav({ currentUserId }: BottomNavProps) {
  const pathname = usePathname()
  const currentUser = useQuery(api.users.getCurrentUser)
  const totalUnread = useQuery(
    api.conversations.getTotalUnreadCount,
    currentUser ? {} : "skip"
  )

  const isActive = (href: string) => {
    if (href === "/feed") return pathname === "/feed"
    if (href === "/profile") return pathname.startsWith("/profile")
    return pathname.startsWith(href)
  }

  return (
    <nav
      aria-label="Mobile navigation"
      className="fixed bottom-0 inset-x-0 z-50 md:hidden border-t border-border/50 bg-card/80 backdrop-blur-2xl shadow-elevation-3"
      style={{ paddingBottom: "env(safe-area-inset-bottom, 0px)" }}
    >
      <div className="flex items-center justify-around h-14">
        {TABS.map(({ label, href, icon: Icon }) => {
          const active = isActive(href)
          const resolvedHref =
            href === "/profile" && currentUserId
              ? `/profile/${currentUserId}`
              : href

          const showBadge =
            href === "/messages" &&
            typeof totalUnread === "number" &&
            totalUnread > 0

          return (
            <Link
              key={href}
              href={resolvedHref}
              className={cn(
                "relative flex flex-col items-center justify-center gap-0.5 w-16 h-full transition-all duration-200",
                active
                  ? "text-primary"
                  : "text-muted-foreground active:text-foreground active:scale-95"
              )}
              aria-label={label}
              aria-current={active ? "page" : undefined}
            >
              {active && (
                <span className="absolute inset-x-2 top-1.5 bottom-1.5 rounded-2xl bg-primary/10" aria-hidden="true" />
              )}
              <div className="relative">
                <Icon
                  className={cn(
                    "h-[22px] w-[22px] transition-all duration-200",
                    active && "scale-110"
                  )}
                  strokeWidth={active ? 2.4 : 1.8}
                  fill={active ? "currentColor" : "none"}
                />
                {showBadge && (
                  <span className="absolute -top-1.5 -right-2 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-accent-rose px-1 text-[9px] font-bold text-white shadow-sm">
                    {totalUnread > 99 ? "99+" : totalUnread}
                  </span>
                )}
              </div>
              <span
                className={cn(
                  "text-[10px] leading-tight",
                  active ? "font-bold" : "font-medium"
                )}
              >
                {label}
              </span>
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
