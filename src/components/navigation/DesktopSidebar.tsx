"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { useUser } from "@/lib/auth/client";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { 
  Users, Briefcase, Store, Bookmark, Hash, Trophy, 
  BookOpen, FolderOpen, Calendar, HelpCircle,
  Home, Bell, MessageCircle, Search
} from "lucide-react";

export function DesktopSidebar() {
  const pathname = usePathname();
  const { user, isSignedIn } = useUser();
  
  const isActive = (path: string) => pathname === path || pathname?.startsWith(path + '/');

  const links = [
    { href: "/feed", icon: Home, label: "Home" },
    { href: "/explore", icon: Hash, label: "Explore" },
    { href: "/notifications", icon: Bell, label: "Notifications" },
    { href: "/messages", icon: MessageCircle, label: "Messages" },
    { href: "/bookmarks", icon: Bookmark, label: "Saved" },
    { href: "/communities", icon: Users, label: "Groups" },
    { href: "/events", icon: Calendar, label: "Events" },
    { href: "/jobs", icon: Briefcase, label: "Jobs" },
    { href: "/marketplace", icon: Store, label: "Marketplace" },
    { href: "/research", icon: BookOpen, label: "Research" },
    { href: "/resources", icon: FolderOpen, label: "Resources" },
    { href: "/q-and-a", icon: HelpCircle, label: "Q&A" },
    { href: "/leaderboard", icon: Trophy, label: "Leaderboard" },
  ];

  return (
    <div className="w-full flex flex-col py-4 px-3 h-full gap-4 overflow-y-auto overflow-x-hidden scrollbar-hide">
      
      {/* Brand Logo */}
      <div className="pb-2 flex justify-start pl-1">
        <Link href="/feed" className="flex items-center gap-4 w-fit group/logo">
          <div className="h-10 w-10 shrink-0 rounded-full bg-primary flex items-center justify-center shadow-sm transition-transform group-hover/logo:scale-105">
            <span className="text-primary-foreground text-sm font-bold">CC</span>
          </div>
          <span className="text-xl font-bold text-foreground whitespace-nowrap opacity-0 translate-x-[-10px] group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-300">
            Campus Connect
          </span>
        </Link>
      </div>

      {/* Global Search Bar (Only visible when expanded) */}
      <div className="pb-2 opacity-0 h-0 invisible group-hover:opacity-100 group-hover:h-auto group-hover:visible transition-all duration-300 duration-delay-150 pl-1">
        <div className="flex items-center bg-muted rounded-full px-3 py-2 w-[230px]">
          <Search className="h-4 w-4 text-muted-foreground shrink-0" />
          <input 
            type="text" 
            placeholder="Search..." 
            className="bg-transparent border-none outline-none text-[15px] ml-2 w-full placeholder:text-muted-foreground text-foreground"
          />
        </div>
      </div>
      
      {/* Current User Shortcut */}
      {isSignedIn && user && (
        <Link href="/profile/me" className="flex items-center gap-4 py-2 pl-1.5 rounded-lg hover:bg-accent transition-colors mb-2 w-max">
          <Avatar className="h-9 w-9 shrink-0">
            <AvatarImage src={user.profilePicture} alt={user.name} />
            <AvatarFallback className="bg-primary text-primary-foreground text-xs font-bold">
              {user.name.substring(0, 2).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <div className="flex flex-col opacity-0 translate-x-[-10px] group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-300">
            <span className="text-[15px] font-semibold text-foreground whitespace-nowrap">{user.name}</span>
            <span className="text-xs text-muted-foreground whitespace-nowrap">@{user.username || 'user'}</span>
          </div>
        </Link>
      )}

      {/* Main Nav Links */}
      <nav className="flex-1 space-y-1">
        {links.map((link) => {
          const active = isActive(link.href);
          return (
            <Link
              key={link.href}
              href={link.href}
              className={cn(
                "flex items-center gap-4 py-3 pl-2.5 rounded-lg transition-colors relative w-max pr-6 group/link",
                active ? "bg-accent/50" : "hover:bg-accent"
              )}
            >
              <div className="relative shrink-0 flex items-center justify-center">
                <link.icon className={cn(
                  'h-6 w-6 transition-transform group-hover/link:scale-110',
                  active ? 'text-primary stroke-[2.5px]' : 'text-foreground stroke-2'
                )} />
              </div>
              <span className={cn(
                'text-[16px] whitespace-nowrap opacity-0 translate-x-[-10px] group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-300',
                active ? 'font-bold text-foreground' : 'font-medium text-foreground'
              )}>
                {link.label}
              </span>
            </Link>
          );
        })}
      </nav>
      
      {/* Footer Links (Only visible when expanded) */}
      <div className="mt-auto pt-6 px-2 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-300 delay-100">
        <div className="flex flex-wrap gap-x-3 gap-y-1 text-[12px] text-muted-foreground w-[230px]">
          <Link href="#" className="hover:underline">Privacy</Link>
          <Link href="#" className="hover:underline">Terms</Link>
          <Link href="#" className="hover:underline">Advertising</Link>
          <Link href="#" className="hover:underline">Cookies</Link>
          <Link href="#" className="hover:underline">More</Link>
          <span>Campus Connect © 2026</span>
        </div>
      </div>
    </div>
  );
}

