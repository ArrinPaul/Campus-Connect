"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { useUser } from "@/lib/auth/client";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { 
  Users, Briefcase, Store, Bookmark, Hash, Trophy, 
  BookOpen, FolderOpen, Calendar, HelpCircle 
} from "lucide-react";

export function DesktopSidebar() {
  const pathname = usePathname();
  const { user, isSignedIn } = useUser();
  
  const isActive = (path: string) => pathname === path || pathname?.startsWith(path + '/');

  const links = [
    { href: "/explore", icon: Hash, label: "Explore" },
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
    <div className="w-full flex flex-col py-4 px-2 h-full">
      
      {/* Current User Shortcut */}
      {isSignedIn && user && (
        <Link href="/profile/me" className="flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-accent transition-colors mb-4">
          <Avatar className="h-9 w-9">
            <AvatarImage src={user.profilePicture} alt={user.name} />
            <AvatarFallback className="bg-primary text-primary-foreground text-xs font-bold">
              {user.name.substring(0, 2).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <span className="text-[15px] font-semibold text-foreground truncate">{user.name}</span>
        </Link>
      )}

      {/* Main Nav Links */}
      <nav className="flex-1 space-y-0.5">
        {links.map((link) => {
          const active = isActive(link.href);
          return (
            <Link
              key={link.href}
              href={link.href}
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors",
                active ? "bg-accent" : "hover:bg-accent"
              )}
            >
              <link.icon className={cn(
                'h-[22px] w-[22px]',
                active ? 'text-primary fill-primary/10' : 'text-muted-foreground'
              )} strokeWidth={active ? 2 : 1.5} />
              <span className={cn(
                'text-[15px]',
                active ? 'font-semibold text-foreground' : 'font-medium text-foreground'
              )}>
                {link.label}
              </span>
            </Link>
          );
        })}
      </nav>
      
      {/* Footer Links */}
      <div className="mt-auto pt-6 px-3">
        <div className="flex flex-wrap gap-x-3 gap-y-1 text-[13px] text-muted-foreground">
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

