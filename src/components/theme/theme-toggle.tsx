"use client"

import { Moon, Sun } from "lucide-react"
import { useTheme } from "next-themes"
import { useEffect, useState } from "react"

export function ThemeToggle() {
  const { theme, setTheme } = useTheme()
  const [mounted, setMounted] = useState(false)

  // Avoid hydration mismatch
  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) {
    return (
      <button
        className="inline-flex items-center justify-center rounded-md p-2 text-muted-foreground hover:bg-muted hover:text-muted-foreground hover:bg-accent dark:hover:text-muted-foreground"
        aria-label="Toggle theme"
      >
        <Sun className="h-5 w-5" />
      </button>
    )
  }

  const isDark = theme === "dark"

  return (
    <button
      onClick={() => setTheme(isDark ? "light" : "dark")}
      className="inline-flex items-center justify-center rounded-md p-2 text-muted-foreground hover:bg-muted hover:text-muted-foreground hover:bg-accent dark:hover:text-muted-foreground transition-colors"
      aria-label={`Switch to ${isDark ? "light" : "dark"} mode`}
    >
      {isDark ? (
        <Sun className="h-5 w-5" />
      ) : (
        <Moon className="h-5 w-5" />
      )}
    </button>
  )
}
