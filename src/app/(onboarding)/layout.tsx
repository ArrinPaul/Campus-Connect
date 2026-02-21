import type { ReactNode } from "react"
import Link from "next/link"
import { GraduationCap } from "lucide-react"

export default function OnboardingLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Minimal top-bar */}
      <header className="fixed top-0 inset-x-0 z-50 border-b border-border/40 bg-background/80 backdrop-blur-xl">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 flex h-[60px] items-center">
          <Link href="/" className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-xl brand-gradient shadow-glow-sm">
              <GraduationCap className="h-4 w-4 text-white" />
            </div>
            <span className="text-[15px] font-bold tracking-tight text-foreground font-display">
              Campus Connect
            </span>
          </Link>
        </div>
      </header>

      <main className="flex-1 flex items-center justify-center pt-[60px] px-4 py-12">
        {children}
      </main>
    </div>
  )
}
