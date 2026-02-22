"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import {
  Menu,
  X,
  Home,
  Compass,
  MessageSquare,
  Bookmark,
  Bell,
  User,
  Settings,
  Users,
  Calendar,
  Briefcase,
  ShoppingBag,
  FlaskConical,
  FolderOpen,
  HelpCircle,
  Trophy,
  GraduationCap,
} from "lucide-react"
import { UserButton } from "@clerk/nextjs"
import { useQuery } from "convex/react"
import { api } from "@/convex/_generated/api"
import { ThemeToggle } from "@/components/theme/theme-toggle"
import { Id } from "@/convex/_generated/dataModel"
import { cn } from "@/lib/utils"

interface MobileNavProps {
  currentUserId?: Id<"users">
}

const mainLinks = [
  { label: "Feed", href: "/feed", icon: Home },
  { label: "Discover", href: "/discover", icon: Compass },
  { label: "Messages", href: "/messages", icon: MessageSquare },
  { label: "Bookmarks", href: "/bookmarks", icon: Bookmark },
  { label: "Notifications", href: "/notifications", icon: Bell },
]

const exploreLinks = [
  { label: "Communities", href: "/communities", icon: Users },
  { label: "Events", href: "/events", icon: Calendar },
  { label: "Jobs", href: "/jobs", icon: Briefcase },
  { label: "Marketplace", href: "/marketplace", icon: ShoppingBag },
  { label: "Research", href: "/research", icon: FlaskConical },
  { label: "Resources", href: "/resources", icon: FolderOpen },
  { label: "Q&A", href: "/q-and-a", icon: HelpCircle },
  { label: "Leaderboard", href: "/leaderboard", icon: Trophy },
]

export function MobileNav({ currentUserId }: MobileNavProps) {
  const [isOpen, setIsOpen] = useState(false)
  const pathname = usePathname()
  const totalUnread = useQuery(
    api.conversations.getTotalUnreadCount,
    currentUserId ? {} : "skip"
  )

  // Close on route change
  useEffect(() => {
    setIsOpen(false)
  }, [pathname])

  // Prevent body scroll when open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden"
    } else {
      document.body.style.overflow = ""
    }
    return () => {
      document.body.style.overflow = ""
    }
  }, [isOpen])

  const toggleMenu = () => setIsOpen(!isOpen)
  const closeMenu = () => setIsOpen(false)

  const isActive = (href: string) => {
    if (href === "/feed") return pathname === "/feed"
    return pathname.startsWith(href)
  }

  return (
    <>
      {/* Toggle Button */}
      <button
        onClick={toggleMenu}
        className="inline-flex h-10 w-10 items-center justify-center rounded-lg text-muted-foreground hover:bg-accent hover:text-accent-foreground transition-colors md:hidden"
        aria-expanded={isOpen}
        aria-label="Toggle navigation menu"
      >
        {isOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
      </button>

      {/* Backdrop */}
      <div
        className={cn(
          "fixed inset-0 z-40 bg-foreground/20 backdrop-blur-sm transition-opacity duration-300 md:hidden",
          isOpen ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
        )}
        onClick={closeMenu}
        aria-hidden="true"
      />

      {/* Panel */}
      <div
        className={cn(
          "fixed left-0 top-0 z-50 h-full w-72 bg-card/90 backdrop-blur-2xl border-r border-border shadow-elevation-4 transition-transform duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] md:hidden",
          isOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <div className="flex h-full flex-col">
          {/* Header */}
          <div className="flex h-16 items-center justify-between border-b border-border px-4">
            <div className="flex items-center gap-2.5">
              <div className="flex h-8 w-8 items-center justify-center rounded-xl brand-gradient shadow-glow-sm">
                <GraduationCap className="h-4 w-4 text-primary-foreground" />
              </div>
              <span className="font-semibold text-foreground">Menu</span>
            </div>
            <button
              onClick={closeMenu}
              className="h-10 w-10 flex items-center justify-center rounded-lg text-muted-foreground hover:bg-accent hover:text-accent-foreground transition-colors"
              aria-label="Close menu"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Nav Links */}
          <nav className="flex-1 overflow-y-auto py-3 px-3 scrollbar-thin">
            <div className="space-y-0.5">
              {mainLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={closeMenu}
                  className={cn(
                    "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors",
                    isActive(link.href)
                      ? "bg-primary/10 text-primary"
                      : "text-muted-foreground hover:bg-accent/70 hover:text-foreground"
                  )}
                >
                  <link.icon className="h-[18px] w-[18px] shrink-0" />
                  <span>{link.label}</span>
                  {link.href === "/messages" &&
                    typeof totalUnread === "number" &&
                    totalUnread > 0 && (
                      <span className="ml-auto flex h-5 min-w-[20px] items-center justify-center rounded-full bg-destructive px-1.5 text-[10px] font-bold text-destructive-foreground">
                        {totalUnread > 99 ? "99+" : totalUnread}
                      </span>
                    )}
                </Link>
              ))}
            </div>

            <p className="mt-5 mb-2 px-3 text-xs font-medium uppercase tracking-wider text-muted-foreground/70">
              Explore
            </p>
            <div className="space-y-0.5">
              {exploreLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={closeMenu}
                  className={cn(
                    "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors",
                    isActive(link.href)
                      ? "bg-primary/10 text-primary"
                      : "text-muted-foreground hover:bg-accent/70 hover:text-foreground"
                  )}
                >
                  <link.icon className="h-[18px] w-[18px] shrink-0" />
                  <span>{link.label}</span>
                </Link>
              ))}
            </div>

            {/* Profile & Settings */}
            <div className="mt-4 pt-4 border-t border-border space-y-0.5">
              {currentUserId && (
                <Link
                  href={`/profile/${currentUserId}`}
                  onClick={closeMenu}
                  className={cn(
                    "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors",
                    pathname.startsWith("/profile")
                      ? "bg-primary/10 text-primary"
                      : "text-muted-foreground hover:bg-accent/70 hover:text-foreground"
                  )}
                >
                  <User className="h-[18px] w-[18px] shrink-0" />
                  <span>Profile</span>
                </Link>
              )}
              <Link
                href="/settings"
                onClick={closeMenu}
                className={cn(
                  "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors",
                  pathname.startsWith("/settings")
                    ? "bg-primary/10 text-primary"
                    : "text-muted-foreground hover:bg-accent/70 hover:text-foreground"
                )}
              >
                <Settings className="h-[18px] w-[18px] shrink-0" />
                <span>Settings</span>
              </Link>
            </div>
          </nav>

          {/* Footer */}
          <div className="border-t border-border p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <ThemeToggle />
                <span className="text-xs text-muted-foreground">Theme</span>
              </div>
              <UserButton
                appearance={{
                  elements: {
                    avatarBox: "h-9 w-9 rounded-lg",
                  },
                }}
                afterSignOutUrl="/"
              />
            </div>
          </div>
        </div>
      </div>
    </>
  )
}
