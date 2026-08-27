import React from 'react'
import Link from 'next/link'

export default function AuthLayout({ children }: { children: React.ReactNode }) {
 return (
 <div className="min-h-screen flex bg-canvas">
 {/* Left Panel â€” Decorative (desktop only) */}
 <div className="hidden lg:flex lg:w-[45%] xl:w-[50%] bg-surface-soft border-r border-hairline relative overflow-hidden flex-col justify-between p-12">

 {/* Logo â€” matches GlobalNav/DesktopSidebar CC icon pattern */}
 <Link href="/" className="relative z-10 flex items-center gap-3">
 <div className="h-10 w-10 rounded-xl bg-primary flex items-center justify-center shrink-0 shadow-sm">
 <span className="text-white text-lg font-bold">CC</span>
 </div>
 <span className="text-body-md-bold text-ink-deep tracking-tight">
 Campus Connect
 </span>
 </Link>

 {/* Center content */}
 <div className="relative z-10 max-w-md">
 <h2 className="text-hero-display text-primary mb-6 tracking-tight font-bold leading-tight">
 Your campus,<br />reimagined.
 </h2>
 <p className="text-[20px] text-ink-deep leading-relaxed">
 Join thousands of students already connecting, collaborating, and thriving on the fastest growing campus platform.
 </p>
 </div>

 {/* Bottom footer */}
 <p className="relative z-10 text-xs text-slate">
 Â© {new Date().getFullYear()} Campus Connect Inc.
 </p>
 </div>

 {/* Right Panel â€” Form */}
 <div className="flex-1 flex flex-col">
 {/* Mobile header with gradient accent */}
 <div className="lg:hidden bg-surface-soft border-b border-hairline shadow-sm px-4 py-4 flex items-center gap-3">
 <Link href="/" className="flex items-center gap-2">
 <div className="h-8 w-8 rounded-xl bg-primary flex items-center justify-center shrink-0">
 <span className="text-white text-sm font-bold">CC</span>
 </div>
 <span className="text-body-md-bold text-ink-deep tracking-tight">
 Campus Connect
 </span>
 </Link>
 </div>

 {/* Form area */}
 <main className="flex-1 flex items-center justify-center p-4 md:p-8 bg-canvas">
 <div className="w-full max-w-[440px]">
 {children}
 </div>
 </main>

 {/* Mobile footer */}
 <footer className="lg:hidden py-lg px-xl text-center">
 <p className="text-xs text-slate">
 Â© {new Date().getFullYear()} Campus Connect Inc.
 </p>
 </footer>
 </div>
 </div>
 )
}

