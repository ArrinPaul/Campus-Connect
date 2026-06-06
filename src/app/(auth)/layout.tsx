import React from "react"
import { GlobalNav } from "@/components/navigation/GlobalNav"

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="min-h-screen bg-canvas-parchment flex flex-col">
      <GlobalNav />
      <main className="flex-1 flex items-center justify-center p-4 md:p-8 animate-in">
        <div className="w-full max-w-[480px] bg-canvas border border-hairline rounded-lg shadow-product p-8 md:p-12">
          {children}
        </div>
      </main>
      
      {/* Optional: Minimal Footer for Auth */}
      <footer className="py-8 px-4 text-center">
        <p className="text-fine-print text-ink-muted-48">
          © {new Date().getFullYear()} Campus Connect. All rights reserved.
        </p>
      </footer>
    </div>
  )
}
