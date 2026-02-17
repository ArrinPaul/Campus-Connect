import { UserButton } from "@clerk/nextjs"
import Link from "next/link"

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navigation Bar */}
      <nav className="border-b bg-white shadow-sm">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between">
            {/* Logo and Brand */}
            <div className="flex items-center">
              <Link href="/feed" className="text-xl font-bold text-blue-600">
                Campus Connect
              </Link>
            </div>

            {/* Navigation Links */}
            <div className="flex items-center gap-6">
              <Link
                href="/feed"
                className="text-sm font-medium text-gray-700 hover:text-blue-600"
              >
                Feed
              </Link>
              <Link
                href="/discover"
                className="text-sm font-medium text-gray-700 hover:text-blue-600"
              >
                Discover
              </Link>
              <Link
                href="/profile"
                className="text-sm font-medium text-gray-700 hover:text-blue-600"
              >
                Profile
              </Link>
              
              {/* User Button */}
              <UserButton
                appearance={{
                  elements: {
                    avatarBox: "h-9 w-9",
                  },
                }}
              />
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main>{children}</main>
    </div>
  )
}
