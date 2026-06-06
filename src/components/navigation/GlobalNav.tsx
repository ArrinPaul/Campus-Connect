import React from "react";
import Link from "next/link";
import { Search, ShoppingBag } from "lucide-react";

export function GlobalNav() {
  return (
    <nav className="h-[44px] bg-tile-black text-white flex items-center px-4 md:px-8 justify-between sticky top-0 z-50">
      <div className="flex items-center gap-6">
        <Link href="/" className="text-white hover:opacity-80 transition-opacity">
          <svg
            viewBox="0 0 24 24"
            width="18"
            height="18"
            stroke="currentColor"
            strokeWidth="2"
            fill="none"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
          </svg>
        </Link>
        <div className="hidden md:flex gap-5 text-nav-link">
          <Link href="/feed" className="hover:opacity-70 transition-opacity">Feed</Link>
          <Link href="/discover" className="hover:opacity-70 transition-opacity">Discover</Link>
          <Link href="/communities" className="hover:opacity-70 transition-opacity">Communities</Link>
          <Link href="/jobs" className="hover:opacity-70 transition-opacity">Jobs</Link>
          <Link href="/marketplace" className="hover:opacity-70 transition-opacity">Marketplace</Link>
        </div>
      </div>
      <div className="flex items-center gap-4">
        <button className="hover:opacity-70 transition-opacity">
          <Search size={16} />
        </button>
        <button className="hover:opacity-70 transition-opacity">
          <ShoppingBag size={16} />
        </button>
      </div>
    </nav>
  );
}
