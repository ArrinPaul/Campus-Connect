"use client"

import { UserButton } from "@clerk/nextjs"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { ThemeToggle } from "@/components/theme/theme-toggle"
import { MobileNav } from "@/components/navigation/mobile-nav"
import { NotificationBell } from "@/components/notifications/NotificationBell"
import { UniversalSearchBar } from "@/components/navigation/UniversalSearchBar"
import { KeyboardShortcutsModal } from "@/components/accessibility/KeyboardShortcutsModal"
import { useQuery } from "convex/react"
import { api } from "@/convex/_generated/api"
import { useHeartbeat } from "@/hooks/useHeartbeat"
import { IncomingCallNotification } from "@/components/calls/IncomingCallNotification"
import { BottomNav } from "@/components/navigation/BottomNav"
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
  Keyboard,
  PanelLeftClose,
  PanelLeftOpen,
} from "lucide-react"
import { useEffect, useRef, useState } from "react"

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
  const [shortcutsOpen, setShortcutsOpen] = useState(false)
  const router = useRouter()
  const gPressedRef = useRef(false)
  const gTimerRef = useRef<NodeJS.Timeout | null>(null)

  useHeartbeat(!!currentUser)

  // ── Global keyboard shortcuts ──────────────────────────────
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      const tag = (e.target as HTMLElement).tagName
      const isEditable =
        tag === "INPUT" ||
        tag === "TEXTAREA" ||
        (e.target as HTMLElement).isContentEditable

      // ? → open keyboard shortcuts (any context)
      if (e.key === "?" && !e.ctrlKey && !e.metaKey && !e.altKey) {
        e.preventDefault()
        setShortcutsOpen((o) => !o)
        return
      }

      // Remaining shortcuts are disabled when typing
      if (isEditable) return

      // / → focus search
      if (e.key === "/") {
        e.preventDefault()
        const searchInput = document.querySelector<HTMLInputElement>(
          "[data-search-input]"
        )
        searchInput?.focus()
        return
      }

      // G + <key> navigation sequences
      if (e.key === "g" || e.key === "G") {
        gPressedRef.current = true
        if (gTimerRef.current) clearTimeout(gTimerRef.current)
        gTimerRef.current = setTimeout(() => {
          gPressedRef.current = false
        }, 1000)
        return
      }

      if (gPressedRef.current) {
        gPressedRef.current = false
        if (gTimerRef.current) clearTimeout(gTimerRef.current)
        const map: Record<string, string> = {
          f: "/feed",
          F: "/feed",
          d: "/discover",
          D: "/discover",
          m: "/messages",
          M: "/messages",
          b: "/bookmarks",
          B: "/bookmarks",
          p: "/profile",
          P: "/profile",
          s: "/settings",
          S: "/settings",
        }
        const dest = map[e.key]
        if (dest) {
          e.preventDefault()
          if (dest === "/profile" && currentUser) {
            router.push(`/profile/${currentUser._id}`)
          } else {
            router.push(dest)
          }
        }
      }
    }

    window.addEventListener("keydown", handleKeyDown)
    return () => {
      window.removeEventListener("keydown", handleKeyDown)
      if (gTimerRef.current) clearTimeout(gTimerRef.current)
    }
  }, [router, currentUser])

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
      {/* ── Atmosphere layers ─────────────────────────────── */}
      <div className="atmosphere-noise" aria-hidden="true" />
      <div className="atmosphere-orb atmosphere-orb-primary" aria-hidden="true" />
      <div className="atmosphere-orb atmosphere-orb-violet" aria-hidden="true" />

      <KeyboardShortcutsModal open={shortcutsOpen} onOpenChange={setShortcutsOpen} />

      {/* ── Sidebar (desktop) ─────────────────────────────── */}
      <aside
        aria-label="Main navigation"
        className={cn(
          "hidden md:flex flex-col fixed inset-y-0 left-0 z-40 border-r border-sidebar-border sidebar-glass transition-all duration-300 ease-in-out",
          collapsed ? "w-[72px]" : "w-[248px]"
        )}
      >
        {/* Brand */}
        <div className={cn(
          "flex h-[60px] items-center gap-3 border-b border-sidebar-border transition-all duration-300",
          collapsed ? "px-[17px] justify-center" : "px-5"
        )}>
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl brand-gradient shadow-glow-sm">
            <GraduationCap className="h-4.5 w-4.5 text-white" />
          </div>
          {!collapsed && (
            <span className="text-[15px] font-bold tracking-tight text-sidebar-foreground font-display truncate">
              Campus Connect
            </span>
          )}
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto py-3 px-3 scrollbar-thin space-y-0.5" aria-label="Primary">
          {/* Main nav */}
          {mainNav.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              title={collapsed ? item.label : undefined}
              className={cn(
                "group relative flex items-center gap-3 rounded-xl px-3 py-2.5 text-[13.5px] font-medium transition-all duration-150",
                isActive(item.href)
                  ? "bg-gradient-to-r from-primary/15 via-primary/10 to-transparent text-foreground"
                  : "text-muted-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
              )}
            >
              {isActive(item.href) && (
                <span className="absolute left-0 top-1/2 -translate-y-1/2 h-5 w-1 rounded-r-full brand-gradient" />
              )}
              <item.icon className={cn(
                "h-[19px] w-[19px] shrink-0 transition-all duration-150",
                isActive(item.href) ? "text-primary" : "group-hover:text-foreground"
              )} />
              {!collapsed && (
                <>
                  <span className="truncate">{item.label}</span>
                  {item.badge && (
                    <span className="ml-auto flex h-5 min-w-[20px] items-center justify-center rounded-full bg-primary px-1.5 text-[10px] font-bold text-primary-foreground">
                      {item.badge}
                    </span>
                  )}
                </>
              )}
              {collapsed && item.badge && (
                <span className="absolute top-1 right-1 flex h-3.5 min-w-[14px] items-center justify-center rounded-full bg-primary px-0.5 text-[8px] font-bold text-primary-foreground">
                  {item.badge}
                </span>
              )}
            </Link>
          ))}

          {/* Divider + Explore */}
          <div className="my-3 mx-1 h-px bg-sidebar-border/60" />
          {!collapsed && (
            <p className="mb-1.5 px-3 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/50" id="explore-nav-label">
              Explore
            </p>
          )}
          {exploreNav.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              title={collapsed ? item.label : undefined}
              className={cn(
                "group relative flex items-center gap-3 rounded-xl px-3 py-2.5 text-[13.5px] font-medium transition-all duration-150",
                isActive(item.href)
                  ? "bg-gradient-to-r from-primary/15 via-primary/10 to-transparent text-foreground"
                  : "text-muted-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
              )}
            >
              {isActive(item.href) && (
                <span className="absolute left-0 top-1/2 -translate-y-1/2 h-5 w-1 rounded-r-full brand-gradient" />
              )}
              <item.icon className={cn(
                "h-[18px] w-[18px] shrink-0 transition-all duration-150",
                isActive(item.href) ? "text-primary" : "group-hover:text-foreground"
              )} />
              {!collapsed && <span className="truncate">{item.label}</span>}
            </Link>
          ))}
        </nav>

        {/* Bottom section */}
        <div className="border-t border-sidebar-border px-3 py-3 space-y-0.5">
          {currentUser && (
            <Link
              href={`/profile/${currentUser._id}`}
              title={collapsed ? "Profile" : undefined}
              className={cn(
                "group relative flex items-center gap-3 rounded-xl px-3 py-2.5 text-[13.5px] font-medium transition-all duration-150",
                pathname.startsWith("/profile")
                  ? "bg-gradient-to-r from-primary/15 via-primary/10 to-transparent text-foreground"
                  : "text-muted-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
              )}
            >
              {pathname.startsWith("/profile") && (
                <span className="absolute left-0 top-1/2 -translate-y-1/2 h-5 w-1 rounded-r-full brand-gradient" />
              )}
              <User className={cn("h-[18px] w-[18px] shrink-0", pathname.startsWith("/profile") && "text-primary")} />
              {!collapsed && <span className="truncate">Profile</span>}
            </Link>
          )}
          <Link
            href="/settings"
            title={collapsed ? "Settings" : undefined}
            className={cn(
              "group relative flex items-center gap-3 rounded-xl px-3 py-2.5 text-[13.5px] font-medium transition-all duration-150",
              pathname.startsWith("/settings")
                ? "bg-gradient-to-r from-primary/15 via-primary/10 to-transparent text-foreground"
                : "text-muted-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
            )}
          >
            {pathname.startsWith("/settings") && (
              <span className="absolute left-0 top-1/2 -translate-y-1/2 h-5 w-1 rounded-r-full brand-gradient" />
            )}
            <Settings className={cn("h-[18px] w-[18px] shrink-0", pathname.startsWith("/settings") && "text-primary")} />
            {!collapsed && <span className="truncate">Settings</span>}
          </Link>

          {/* User profile + collapse */}
          {!collapsed ? (
            <div className="mt-2 pt-2 border-t border-sidebar-border/60 flex items-center gap-2.5">
              <div className="shrink-0">
                <UserButton
                  appearance={{ elements: { avatarBox: "h-8 w-8 rounded-full" } }}
                  afterSignOutUrl="/"
                />
              </div>
              {currentUser && (
                <div className="flex-1 min-w-0">
                  <p className="text-[13px] font-semibold text-sidebar-foreground truncate leading-tight">{currentUser.name}</p>
                  {currentUser.username && (
                    <p className="text-[11px] text-muted-foreground/70 truncate leading-tight">@{currentUser.username}</p>
                  )}
                </div>
              )}
              <button
                onClick={() => setCollapsed(true)}
                className="ml-auto p-1.5 rounded-lg text-muted-foreground hover:bg-sidebar-accent hover:text-foreground transition-colors"
                title="Collapse sidebar"
              >
                <PanelLeftClose className="h-4 w-4" />
              </button>
            </div>
          ) : (
            <button
              onClick={() => setCollapsed(false)}
              className="w-full flex items-center justify-center rounded-xl p-2.5 text-muted-foreground hover:bg-sidebar-accent hover:text-foreground transition-colors"
              title="Expand sidebar"
            >
              <PanelLeftOpen className="h-[18px] w-[18px]" />
            </button>
          )}
        </div>
      </aside>

      {/* ── Main Area ─────────────────────────────────────── */}
      <div className={cn("flex flex-1 flex-col transition-all duration-300", collapsed ? "md:pl-[72px]" : "md:pl-[248px]")}>
        {/* Top Bar */}
        <header
          role="banner"
          aria-label="Site header"
          className="sticky top-0 z-30 flex h-[60px] items-center gap-3 border-b border-border/60 glass-strong px-4 shadow-elevation-1 sm:px-6"
        >
          {/* Mobile hamburger */}
          <div className="flex items-center md:hidden">
            <MobileNav currentUserId={currentUser?._id} />
          </div>

          {/* Mobile logo */}
          <Link href="/feed" className="flex items-center gap-2.5 md:hidden">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg brand-gradient">
              <GraduationCap className="h-3.5 w-3.5 text-white" />
            </div>
            <span className="font-bold text-foreground text-sm font-display">Campus Connect</span>
          </Link>

          {/* Search */}
          <div className="hidden md:flex flex-1 max-w-lg">
            <UniversalSearchBar />
          </div>

          {/* Presence chip */}
          <div className="hidden lg:flex items-center gap-2 presence-chip">
            <span className="presence-pulse" aria-hidden="true" />
            <span className="text-foreground">Live now</span>
            <span className="text-muted-foreground/70">campus pulse</span>
          </div>

          {/* Mobile search icon */}
          <Link href="/search" className="md:hidden ml-auto p-2 text-muted-foreground hover:text-foreground rounded-lg transition-colors">
            <Search className="h-5 w-5" />
          </Link>

          {/* Right actions */}
          <div className="flex items-center gap-1 ml-auto">
            <NotificationBell />
            <ThemeToggle />
            <button
              onClick={() => setShortcutsOpen(true)}
              className="p-2 text-muted-foreground hover:bg-accent hover:text-foreground rounded-xl transition-colors hidden sm:flex"
              aria-label="Keyboard shortcuts"
              title="Keyboard shortcuts (?)"
            >
              <Keyboard className="h-[17px] w-[17px]" />
            </button>
            <div className="md:hidden ml-1">
              <UserButton
                appearance={{ elements: { avatarBox: "h-8 w-8 rounded-full" } }}
                afterSignOutUrl="/"
              />
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main id="main-content" className="relative z-10 flex-1 pb-16 md:pb-0" aria-label="Main content" tabIndex={-1}>
          {children}
        </main>
      </div>

      {/* Mobile bottom tab bar */}
      <BottomNav currentUserId={currentUser?._id} />

      {currentUser && <IncomingCallNotification />}
    </div>
  )
}

