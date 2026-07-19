import React from 'react'
import Link from 'next/link'

export default function AuthLayout({ children }: { children: React.ReactNode }) {
 return (
 <div className="min-h-screen flex bg-canvas">
 {/* Left Panel — Decorative (desktop only) */}
 <div className="hidden lg:flex lg:w-[45%] xl:w-[50%] auth-gradient-panel relative overflow-hidden flex-col justify-between p-section-lg">

 {/* Logo — matches GlobalNav/DesktopSidebar CC icon pattern */}
 <Link href="/" className="relative z-10 flex items-center gap-3">
 <div className="h-10 w-10 rounded-2xl bg-white/20 flex items-center justify-center shrink-0">
 <span className="text-white text-lg font-bold">CC</span>
 </div>
 <span className="text-body-md-bold text-white tracking-tight">
 Campus Connect
 </span>
 </Link>

 {/* Center content */}
 <div className="relative z-10 max-w-md">
 <h2 className="text-display-lg text-white mb-lg tracking-tight font-display">
 Your campus,<br />reimagined.
 </h2>
 <p className="text-subtitle-md text-white/80">
 Join thousands of students already connecting, collaborating, and thriving on the fastest growing campus platform.
 </p>
 </div>

 {/* Bottom footer */}
 <p className="relative z-10 text-xs text-white/50">
 © {new Date().getFullYear()} Campus Connect Inc.
 </p>
 </div>

 {/* Right Panel — Form */}
 <div className="flex-1 flex flex-col">
 {/* Mobile header with gradient accent */}
 <div className="lg:hidden auth-gradient-panel px-4 py-lg flex items-center gap-3">
 <Link href="/" className="flex items-center gap-2">
 <div className="h-8 w-8 rounded-xl bg-white/20 flex items-center justify-center shrink-0">
 <span className="text-white text-sm font-bold">CC</span>
 </div>
 <span className="text-body-md-bold text-white tracking-tight">
 Campus Connect
 </span>
 </Link>
 </div>

 {/* Form area */}
 <main className="flex-1 flex items-center justify-center px-base py-section-sm md:px-xl">
 <div className="w-full max-w-[440px]">
 {children}
 </div>
 </main>

 {/* Mobile footer */}
 <footer className="lg:hidden py-lg px-xl text-center">
 <p className="text-xs text-slate">
 © {new Date().getFullYear()} Campus Connect Inc.
 </p>
 </footer>
 </div>
 </div>
 )
}
