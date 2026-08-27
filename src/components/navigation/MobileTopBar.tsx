'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Search, MessageCircle, User } from 'lucide-react';
import { useUser } from '@/lib/auth/client';
import { useQuery } from '@/lib/api';
import { api } from '@/lib/api';

export function MobileTopBar() {
 const { isLoaded, isSignedIn, user } = useUser();
 const pathname = usePathname();

 const unreadCount = useQuery(
 api.notifications.getUnreadCount,
 isSignedIn ? {} : 'skip'
 );

 return (
 <nav className="flex items-center justify-between h-14 px-4 bg-surface-soft border-b border-hairline shadow-sm sticky top-0 z-50">
 {/* Left: Logo */}
 <Link href="/feed" className="flex items-center gap-2 shrink-0">
 <div className="h-8 w-8 rounded-xl bg-primary flex items-center justify-center">
 <span className="text-white text-sm font-bold">CC</span>
 </div>
 </Link>

    {/* Right: Actions */}
   <div className="flex items-center gap-1.5">
   <Link
   href="/search"
   className="h-9 w-9 flex items-center justify-center rounded-full bg-muted text-ink hover:bg-border transition-colors"
   >
   <Search className="h-5 w-5" />
   </Link>
  
   {isSignedIn && (
   <>
   <Link
   href="/messages"
   className="relative h-9 w-9 flex items-center justify-center rounded-full bg-muted text-ink hover:bg-border transition-colors"
   >
   <MessageCircle className="h-5 w-5" />
   </Link>
   <Link
   href="/profile/me"
   className="relative h-9 w-9 flex items-center justify-center rounded-full bg-muted text-ink hover:bg-border transition-colors overflow-hidden border border-hairline"
   >
   <User className="h-5 w-5" />
   </Link>
   </>
   )}
   </div>
   </nav>
 );
}



