"use client";

import React from "react";
import Link from "next/link";
import { Search, Home, Users, Briefcase, Store, Bell, MessageCircle, Menu } from "lucide-react";
import { usePathname } from "next/navigation";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useUser } from "@/lib/auth/client";
import { cn } from "@/lib/utils";
export function TopNav() {
  const pathname = usePathname();
  const { user, isLoaded, isSignedIn } = useUser();

  const isActive = (path: string) => pathname?.startsWith(path);

  const mainLinks = [
    { href: "/feed", icon: Home, label: "Home" },
    { href: "/communities", icon: Users, label: "Groups" },
    { href: "/jobs", icon: Briefcase, label: "Jobs" },
    { href: "/marketplace", icon: Store, label: "Marketplace" },
  ];

  return (
    <header className="fixed top-0 inset-x-0 h-14 bg-card border-b border-border z-50 shadow-sm flex justify-center">
      <div className="w-full max-w-[1280px] flex items-center justify-between px-4">
        {/* Left: Brand & Search */}
        <div className="flex items-center gap-4 w-[280px] shrink-0">
          <Link href="/feed" className="flex items-center justify-center shrink-0">
            <div className="h-10 w-10 rounded-full bg-primary flex items-center justify-center shadow-sm">
              <span className="text-primary-foreground text-sm font-bold">CC</span>
            </div>
          </Link>
          <div className="hidden md:flex items-center bg-muted rounded-full px-3 py-2 flex-1 ml-2">
            <Search className="h-4 w-4 text-muted-foreground shrink-0" />
            <input 
              type="text" 
              placeholder="Search..." 
              className="bg-transparent border-none outline-none text-[15px] ml-2 w-full placeholder:text-muted-foreground text-foreground"
            />
          </div>
        </div>

        {/* Center: Main Navigation */}
        <nav className="hidden md:flex items-center justify-center h-full flex-1 max-w-[590px]">
        <div className="flex items-center justify-between w-full px-4 h-full">
          {mainLinks.map((link) => {
            const active = isActive(link.href);
            return (
              <Link 
                key={link.href} 
                href={link.href}
                className="relative h-full flex flex-col items-center justify-center w-24 group px-1"
              >
                <div className={cn(
                  "flex items-center justify-center w-full h-11 rounded-lg transition-colors",
                  !active && "group-hover:bg-accent"
                )}>
                  <link.icon className={cn(
                    "h-6 w-6 transition-colors",
                    active ? "text-primary fill-primary" : "text-muted-foreground"
                  )} strokeWidth={active ? 2 : 1.5} />
                </div>
                {active && (
                  <div className="absolute bottom-0 inset-x-1 h-[3px] bg-primary rounded-t-full" />
                )}
              </Link>
            )
          })}
        </div>
      </nav>

      {/* Right: User Actions */}
      <div className="flex items-center justify-end gap-4 w-[280px] shrink-0">
        {isLoaded && isSignedIn && user ? (
          <>
            <Link href="/messages" className="h-10 w-10 rounded-full bg-muted flex items-center justify-center hover:bg-border transition-colors text-foreground">
              <MessageCircle className="h-5 w-5" strokeWidth={2} />
            </Link>
            <Link href="/notifications" className="h-10 w-10 rounded-full bg-muted flex items-center justify-center hover:bg-border transition-colors text-foreground">
              <Bell className="h-5 w-5" strokeWidth={2} />
            </Link>
            <Link href="/profile/me" className="ml-1 shrink-0">
              <Avatar className="h-10 w-10 border border-border shadow-sm cursor-pointer hover:opacity-90 transition-opacity">
                <AvatarImage src={user.profilePicture} alt={user.name} />
                <AvatarFallback className="bg-primary text-primary-foreground text-sm font-bold">
                  {user.name.substring(0, 2).toUpperCase()}
                </AvatarFallback>
              </Avatar>
            </Link>
          </>
        ) : (
          <div className="flex items-center gap-2">
            <Link href="/sign-in" className="text-sm font-semibold text-primary hover:bg-primary/10 px-4 py-2 rounded-md transition-colors">
              Log In
            </Link>
            <Link href="/sign-up" className="text-sm font-semibold bg-primary text-primary-foreground hover:bg-primary-deep px-4 py-2 rounded-md transition-colors">
              Sign Up
            </Link>
          </div>
        )}
      </div>
      </div>
    </header>
  );
}

