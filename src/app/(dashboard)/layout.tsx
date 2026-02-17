import { UserButton } from "@clerk/nextjs"
import Link from "next/link"
import { ThemeToggle } from "@/components/theme/theme-toggle"
import { MobileNav } from "@/components/navigation/mobile-nav"

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Navigation Bar */}
      <nav className="border-b bg-white shadow-sm dark:bg-gray-800 dark:border-gray-700">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between">
            {/* Logo and Brand */}
            <div className="flex items-center">
              <Link href="/feed" className="text-lg font-bold text-blue-600 dark:text-blue-400 sm:text-xl">
                Campus Connect
              </Link>
            </div>

            {/* Desktop Navigation Links - Hidden on mobile */}
            <div className="hidden items-center gap-4 md:flex lg:gap-6">
              <Link
                href="/feed"
                className="text-sm font-medium text-gray-700 hover:text-blue-600 dark:text-gray-300 dark:hover:text-blue-400"
              >
                Feed
              </Link>
              <Link
                href="/discover"
                className="text-sm font-medium text-gray-700 hover:text-blue-600 dark:text-gray-300 dark:hover:text-blue-400"
              >
                Discover
              </Link>
              <Link
                href="/profile"
                className="text-sm font-medium text-gray-700 hover:text-blue-600 dark:text-gray-300 dark:hover:text-blue-400"
              >
                Profile
              </Link>
              
              {/* Theme Toggle */}
              <ThemeToggle />
              
              {/* User Button */}
              <UserButton
                appearance={{
                  elements: {
                    avatarBox: "h-9 w-9",
                  },
                }}
              />
            </div>

            {/* Mobile Navigation - Shown only on mobile */}
            <div className="flex items-center md:hidden">
              <MobileNav />
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main>{children}</main>
    </div>
  )
}
