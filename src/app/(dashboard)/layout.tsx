"use client"

import { UserButton } from "@clerk/nextjs"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { ThemeToggle } from "@/components/theme/theme-toggle"
import { MobileNav } from "@/components/navigation/mobile-nav"
import { NotificationBell } from "@/components/notifications/NotificationBell"
import { UniversalSearchBar } from "@/components/navigation/UniversalSearchBar"
import { useQuery } from "convex/react"
import { api } from "@/convex/_generated/api"
import { useHeartbeat } from "@/hooks/useHeartbeat"
import { IncomingCallNotification } from "@/components/calls/IncomingCallNotification"
import { cn } from "@/lib/utils"
import {
  Home,
  Compass,
  MessageSquare,
  Bookmark,
  Settings,
  User,
  GraduationCap,
  Briefcase,
  Calendar,
  Users,
  ShoppingBag,
  FlaskConical,
  FolderOpen,
  HelpCircle,
  Trophy,
  Megaphone,
  Search,
  PanelLeftClose,
  PanelLeftOpen,
} from "lucide-react"
import { useState } from "react"

interface NavItem {
  label: string
  href: string
  icon: React.ElementType
  badge?: number | string
}

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const currentUser = useQuery(api.users.getCurrentUser)
  const totalUnread = useQuery(
    api.conversations.getTotalUnreadCount,
    currentUser ? {} : "skip"
  )
  const pathname = usePathname()
  const [collapsed, setCollapsed] = useState(false)

  useHeartbeat(!!currentUser)

  const mainNav: NavItem[] = [
    { label: "Feed", href: "/feed", icon: Home },
    { label: "Discover", href: "/discover", icon: Compass },
    {
      label: "Messages",
      href: "/messages",
      icon: MessageSquare,
      badge: typeof totalUnread === "number" && totalUnread > 0
        ? totalUnread > 99 ? "99+" : totalUnread
        : undefined,
    },
    { label: "Bookmarks", href: "/bookmarks", icon: Bookmark },
  ]

  const exploreNav: NavItem[] = [
    { label: "Communities", href: "/communities", icon: Users },
    { label: "Events", href: "/events", icon: Calendar },
    { label: "Jobs", href: "/jobs", icon: Briefcase },
    { label: "Marketplace", href: "/marketplace", icon: ShoppingBag },
    { label: "Research", href: "/research", icon: FlaskConical },
    { label: "Resources", href: "/resources", icon: FolderOpen },
    { label: "Q&A", href: "/q-and-a", icon: HelpCircle },
    { label: "Leaderboard", href: "/leaderboard", icon: Trophy },
  ]

  const isActive = (href: string) => {
    if (href === "/feed") return pathname === "/feed"
    return pathname.startsWith(href)
  }

  return (
    <div className="flex min-h-screen bg-background">
      {/* ── Sidebar (desktop) ─────────────────────────────── */}
      <aside
        className={cn(
          "hidden md:flex flex-col fixed inset-y-0 left-0 z-40 border-r border-sidebar-border bg-sidebar transition-all duration-300 ease-in-out",
          collapsed ? "w-[68px]" : "w-60"
        )}
      >
        {/* Brand */}
        <div className="flex h-16 items-center gap-2.5 px-4 border-b border-sidebar-border">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-primary shadow-glow-sm">
            <GraduationCap className="h-5 w-5 text-primary-foreground" />
          </div>
          {!collapsed && (
            <span className="text-base font-semibold tracking-tight text-sidebar-foreground truncate">
              Campus Connect
            </span>
          )}
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto py-4 px-2 scrollbar-thin">
          {/* Main */}
          <div className="space-y-1">
            {mainNav.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "group flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-all duration-150",
                  isActive(item.href)
                    ? "bg-primary/10 text-primary"
                    : "text-muted-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                )}
              >
                <item.icon className={cn("h-[18px] w-[18px] shrink-0", isActive(item.href) && "text-primary")} />
                {!collapsed && (
                  <>
                    <span className="truncate">{item.label}</span>
                    {item.badge && (
                      <span className="ml-auto flex h-5 min-w-[20px] items-center justify-center rounded-full bg-destructive px-1.5 text-[10px] font-bold text-destructive-foreground">
                        {item.badge}
                      </span>
                    )}
                  </>
                )}
                {collapsed && item.badge && (
                  <span className="absolute left-12 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-destructive px-1 text-[9px] font-bold text-destructive-foreground">
                    {item.badge}
                  </span>
                )}
              </Link>
            ))}
          </div>

          {/* Explore section */}
          {!collapsed && (
            <p className="mt-6 mb-2 px-3 text-xs font-medium uppercase tracking-wider text-muted-foreground/70">
              Explore
            </p>
          )}
          {collapsed && <div className="my-4 mx-3 h-px bg-sidebar-border" />}
          <div className="space-y-1">
            {exploreNav.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "group flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-all duration-150",
                  isActive(item.href)
                    ? "bg-primary/10 text-primary"
                    : "text-muted-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                )}
              >
                <item.icon className={cn("h-[18px] w-[18px] shrink-0", isActive(item.href) && "text-primary")} />
                {!collapsed && <span className="truncate">{item.label}</span>}
              </Link>
            ))}
          </div>
        </nav>

        {/* Bottom section */}
        <div className="border-t border-sidebar-border p-2 space-y-1">
          {currentUser && (
            <Link
              href={`/profile/${currentUser._id}`}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-all duration-150",
                pathname.startsWith("/profile")
                  ? "bg-primary/10 text-primary"
                  : "text-muted-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
              )}
            >
              <User className="h-[18px] w-[18px] shrink-0" />
              {!collapsed && <span className="truncate">Profile</span>}
            </Link>
          )}
          <Link
            href="/settings"
            className={cn(
              "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-all duration-150",
              pathname.startsWith("/settings")
                ? "bg-primary/10 text-primary"
                : "text-muted-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
            )}
          >
            <Settings className="h-[18px] w-[18px] shrink-0" />
            {!collapsed && <span className="truncate">Settings</span>}
          </Link>

          {/* Collapse toggle */}
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground transition-all duration-150"
          >
            {collapsed ? (
              <PanelLeftOpen className="h-[18px] w-[18px] shrink-0" />
            ) : (
              <>
                <PanelLeftClose className="h-[18px] w-[18px] shrink-0" />
                <span className="truncate">Collapse</span>
              </>
            )}
          </button>
        </div>
      </aside>

      {/* ── Main Area ─────────────────────────────────────── */}
      <div className={cn("flex flex-1 flex-col transition-all duration-300", collapsed ? "md:pl-[68px]" : "md:pl-60")}>
        {/* Top Bar */}
        <header className="sticky top-0 z-30 flex h-16 items-center gap-4 border-b border-border bg-background/80 backdrop-blur-xl px-4 sm:px-6">
          {/* Mobile hamburger */}
          <div className="flex items-center md:hidden">
            <MobileNav currentUserId={currentUser?._id} />
          </div>

          {/* Mobile logo */}
          <Link href="/feed" className="flex items-center gap-2 md:hidden">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
              <GraduationCap className="h-4 w-4 text-primary-foreground" />
            </div>
            <span className="font-semibold text-foreground text-sm">Campus Connect</span>
          </Link>

          {/* Search */}
          <div className="hidden md:flex flex-1 max-w-xl">
            <UniversalSearchBar />
          </div>

          {/* Mobile search icon */}
          <Link href="/search" className="md:hidden ml-auto p-2 text-muted-foreground hover:text-foreground">
            <Search className="h-5 w-5" />
          </Link>

          {/* Right actions */}
          <div className="flex items-center gap-2 ml-auto">
            <NotificationBell />
            <ThemeToggle />
            <UserButton
              appearance={{
                elements: {
                  avatarBox: "h-8 w-8 rounded-lg",
                },
              }}
              afterSignOutUrl="/"
            />
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1">{children}</main>
      </div>

      {/* Incoming Call Notification (global) */}
      {currentUser && <IncomingCallNotification />}
    </div>
  )
}
