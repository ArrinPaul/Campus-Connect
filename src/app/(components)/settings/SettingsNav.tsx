"use client"

import Link from "next/link"
import { useSearchParams } from "next/navigation"
import { User, Shield, Bell, CreditCard, Lock } from "lucide-react"
import { cn } from "@/lib/utils"

const navItems = [
  { href: "profile", label: "Public Profile", icon: User },
  { href: "account", label: "Account", icon: Lock },
  { href: "privacy", label: "Privacy & Safety", icon: Shield },
  { href: "notifications", label: "Notifications", icon: Bell },
  { href: "billing", label: "Billing", icon: CreditCard },
]

export function SettingsNav() {
  const searchParams = useSearchParams()
  const currentTab = searchParams.get("tab") || "profile"

  return (
    <nav className="flex flex-row md:flex-col gap-1 md:w-56 flex-shrink-0 md:pr-8 md:border-r border-hairline h-fit sticky top-24">
      <div className="hidden md:block mb-4 px-2">
         <h2 className="text-display-md text-ink font-bold">Settings.</h2>
      </div>
      {navItems.map((item) => (
        <Link
          key={item.href}
          href={`/settings?tab=${item.href}`}
          scroll={false}
          className={cn(
            "flex items-center gap-3 px-3 py-2.5 rounded-sm transition-all btn-press text-caption font-semibold",
            currentTab === item.href
              ? "bg-canvas-parchment text-primary shadow-sm"
              : "hover:bg-canvas-parchment/50 text-ink-muted-48 hover:text-ink"
          )}
        >
          <item.icon className={cn("h-4 w-4", currentTab === item.href ? "text-primary" : "text-ink-muted-48")} />
          <span className="hidden md:inline">{item.label}</span>
          
          {/* Action Blue dot for active tab on desktop */}
          {currentTab === item.href && (
            <div className="hidden md:block ml-auto w-1 h-1 bg-primary rounded-full" />
          )}
        </Link>
      ))}
    </nav>
  )
}
