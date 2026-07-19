'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import { Search, X, Bell, LogOut, Menu } from 'lucide-react';
import { useUser, useAuthActions } from '@/lib/auth/client';
import { useQuery } from '@/lib/api';
import { api } from '@/lib/api';
import { cn } from '@/lib/utils';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';

export function GlobalNav() {
 const { isLoaded, isSignedIn, user } = useUser();
 const { signOut } = useAuthActions();
 const pathname = usePathname();
 const router = useRouter();

 const [searchQuery, setSearchQuery] = useState('');
 const [searchOpen, setSearchOpen] = useState(false);
 const [profileOpen, setProfileOpen] = useState(false);
 const searchInputRef = useRef<HTMLInputElement>(null);
 const profileRef = useRef<HTMLDivElement>(null);

 const unreadCount = useQuery(
 api.notifications.getUnreadCount,
 isSignedIn ? {} : 'skip'
 );

 // Close dropdowns on outside click
 useEffect(() => {
 function handleClick(e: MouseEvent) {
 if (profileRef.current && !profileRef.current.contains(e.target as Node)) {
 setProfileOpen(false);
 }
 }
 document.addEventListener('mousedown', handleClick);
 return () => document.removeEventListener('mousedown', handleClick);
 }, []);

 // Focus search input when opened
 useEffect(() => {
 if (searchOpen && searchInputRef.current) {
 searchInputRef.current.focus();
 }
 }, [searchOpen]);

 // Escape key closes search
 useEffect(() => {
 function handleKey(e: KeyboardEvent) {
 if (e.key === 'Escape') {
 setSearchOpen(false);
 setSearchQuery('');
 }
 }
 document.addEventListener('keydown', handleKey);
 return () => document.removeEventListener('keydown', handleKey);
 }, []);

 const handleSearch = useCallback(
 (e: React.FormEvent) => {
 e.preventDefault();
 if (searchQuery.trim()) {
 router.push(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
 setSearchOpen(false);
 setSearchQuery('');
 }
 },
 [searchQuery, router]
 );

 const isActive = (href: string) =>
 pathname === href || (href !== '/' && pathname.startsWith(href));

 const pillLinks = [
 { href: '/feed', label: 'Feed' },
 { href: '/communities', label: 'Communities' },
 { href: '/jobs', label: 'Jobs' },
 { href: '/marketplace', label: 'Marketplace' },
 ];

 return (
 <nav className="sticky top-0 z-50 h-16 bg-canvas border-b border-hairline-soft flex items-center px-4 md:px-6">
 {/* Left: Logo + pill nav */}
 <div className="flex items-center gap-6">
 <Link href="/feed" className="flex items-center gap-2 shrink-0">
 <div className="h-8 w-8 rounded-xl bg-primary flex items-center justify-center">
 <span className="text-white text-sm font-bold">CC</span>
 </div>
 <span className="hidden lg:block text-ink-deep font-bold text-body-md-bold tracking-tight">
 Campus Connect
 </span>
 </Link>

 {/* Pill tab nav (desktop) */}
 <div className="hidden md:flex items-center gap-2">
 {pillLinks.map((link) => (
 <Link
 key={link.href}
 href={link.href}
 className={cn(
 'px-4 py-2 rounded-full text-body-sm-bold font-medium transition-colors',
 isActive(link.href)
 ? 'bg-ink-deep text-canvas'
 : 'bg-canvas text-ink border border-hairline hover:bg-surface-soft'
 )}
 >
 {link.label}
 </Link>
 ))}
 </div>
 </div>

 {/* Right: Search + notifications + profile */}
 <div className="ml-auto flex items-center gap-2">
 {/* Search pill */}
 {searchOpen ? (
 <form onSubmit={handleSearch} className="relative">
 <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-steel" />
 <input
 ref={searchInputRef}
 type="text"
 value={searchQuery}
 onChange={(e) => setSearchQuery(e.target.value)}
 placeholder="Search Campus Connect..."
 className="w-56 md:w-72 h-10 pl-9 pr-9 rounded-full bg-surface-soft text-body-sm text-ink-deep placeholder:text-steel focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all"
 />
 <button
 type="button"
 onClick={() => {
 setSearchOpen(false);
 setSearchQuery('');
 }}
 className="absolute right-3 top-1/2 -translate-y-1/2 text-steel hover:text-ink-deep transition-colors"
 >
 <X className="h-4 w-4" />
 </button>
 </form>
 ) : (
 <button
 onClick={() => setSearchOpen(true)}
 className="h-10 w-10 flex items-center justify-center rounded-full bg-canvas text-ink hover:bg-surface-soft transition-colors"
 aria-label="Search"
 >
 <Search className="h-5 w-5" />
 </button>
 )}

 {/* Notification bell */}
 {isSignedIn && (
 <Link
 href="/notifications"
 className="relative h-10 w-10 flex items-center justify-center rounded-full bg-canvas text-ink hover:bg-surface-soft transition-colors"
 aria-label="Notifications"
 >
 <Bell className="h-5 w-5" />
 {typeof unreadCount === 'number' && unreadCount > 0 && (
 <span className="absolute -top-1 -right-1 flex h-5 min-w-[20px] items-center justify-center rounded-full bg-critical px-1.5 text-caption-bold text-white border-2 border-canvas">
 {unreadCount > 99 ? '99+' : unreadCount}
 </span>
 )}
 </Link>
 )}

 {/* Profile / Auth */}
 {isLoaded && (
 <>
 {isSignedIn && user ? (
 <div className="relative" ref={profileRef}>
 <button
 onClick={() => setProfileOpen(!profileOpen)}
 className="flex items-center gap-2 h-10 pl-1 pr-3 rounded-full hover:bg-surface-soft transition-colors"
 >
 <Avatar className="h-8 w-8">
 <AvatarImage src={user.profilePicture} alt={user.name} />
 <AvatarFallback className="bg-primary text-white text-caption-bold">
 {user.name.substring(0, 2).toUpperCase()}
 </AvatarFallback>
 </Avatar>
 <span className="hidden lg:block text-body-sm-bold text-ink-deep max-w-[100px] truncate">
 {user.name}
 </span>
 </button>

 {/* Profile dropdown */}
 {profileOpen && (
 <div className="absolute right-0 top-full mt-2 w-56 bg-canvas rounded-xl border border-hairline-soft shadow-sticky-panel overflow-hidden">
 <div className="p-3 border-b border-hairline-soft">
 <p className="text-body-sm-bold text-ink-deep truncate">{user.name}</p>
 <p className="text-caption text-steel truncate">{user.email}</p>
 </div>
 <div className="p-1">
 <Link
 href="/profile/me"
 onClick={() => setProfileOpen(false)}
 className="flex items-center gap-2 px-3 py-2 text-body-sm text-ink-deep rounded-lg hover:bg-surface-soft transition-colors"
 >
 Your Profile
 </Link>
 <Link
 href="/settings"
 onClick={() => setProfileOpen(false)}
 className="flex items-center gap-2 px-3 py-2 text-body-sm text-ink-deep rounded-lg hover:bg-surface-soft transition-colors"
 >
 Settings
 </Link>
 <button
 onClick={() => {
 setProfileOpen(false);
 signOut({ redirectUrl: '/' });
 }}
 className="flex items-center gap-2 w-full px-3 py-2 text-body-sm text-critical rounded-lg hover:bg-critical/5 transition-colors"
 >
 <LogOut className="h-4 w-4" />
 Sign Out
 </button>
 </div>
 </div>
 )}
 </div>
 ) : (
 <div className="flex items-center gap-2">
 <Link
 href="/sign-in"
 className="px-6 py-2.5 rounded-full text-button-md text-ink-deep border-2 border-ink-deep hover:bg-surface-soft transition-colors"
 >
 Log In
 </Link>
 <Link
 href="/sign-up"
 className="hidden sm:block px-7 py-3 rounded-full text-button-md bg-ink text-canvas hover:bg-charcoal transition-colors"
 >
 Sign Up
 </Link>
 </div>
 )}
 </>
 )}
 </div>
 </nav>
 );
}
