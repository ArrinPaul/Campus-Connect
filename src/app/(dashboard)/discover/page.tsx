"use client"

import { useState } from "react"
import { useQuery } from "convex/react"
import { api } from "@/convex/_generated/api"
import { UserSearchBar } from "@/components/profile/UserSearchBar"
import { UserFilterPanel } from "@/components/profile/UserFilterPanel"
import { UserCard } from "@/components/profile/UserCard"
import { Loader2 } from "lucide-react"

interface FilterCriteria {
  role?: "Student" | "Research Scholar" | "Faculty"
  skills: string[]
}

export default function DiscoverPage() {
  const [searchQuery, setSearchQuery] = useState("")
  const [filters, setFilters] = useState<FilterCriteria>({
    skills: [],
  })

  // Query users with search and filters
  const users = useQuery(api.users.searchUsers, {
    query: searchQuery || undefined,
    role: filters.role,
    skills: filters.skills.length > 0 ? filters.skills : undefined,
  })

  const handleSearch = (query: string) => {
    setSearchQuery(query)
  }

  const handleFilterChange = (newFilters: FilterCriteria) => {
    setFilters(newFilters)
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-4 sm:px-6 sm:py-8 lg:px-8">
      <div className="mb-4 sm:mb-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 sm:text-3xl">Discover Users</h1>
        <p className="mt-1 text-sm text-gray-600 dark:text-gray-400 sm:mt-2 sm:text-base">
          Find and connect with students, researchers, and faculty
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:gap-6 lg:grid-cols-4">
        {/* Sidebar with filters - Hidden on mobile, shown on tablet+ */}
        <aside className="hidden lg:col-span-1 lg:block">
          <UserFilterPanel onFilterChange={handleFilterChange} />
        </aside>

        {/* Main content area */}
        <main className="lg:col-span-3">
          {/* Search bar */}
          <div className="mb-4 sm:mb-6">
            <UserSearchBar onSearch={handleSearch} />
          </div>

          {/* Mobile filter panel - Shown only on mobile */}
          <div className="mb-4 lg:hidden">
            <UserFilterPanel onFilterChange={handleFilterChange} />
          </div>

          {/* Results */}
          <div className="space-y-3 sm:space-y-4">
            {users === undefined ? (
              // Loading state
              <div className="flex items-center justify-center py-8 sm:py-12">
                <Loader2 className="h-6 w-6 animate-spin text-blue-600 sm:h-8 sm:w-8" />
              </div>
            ) : users.length === 0 ? (
              // Empty state
              <div className="rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-8 text-center sm:p-12">
                <p className="text-base font-medium text-gray-900 dark:text-gray-100 sm:text-lg">No users found</p>
                <p className="mt-1 text-sm text-gray-600 dark:text-gray-400 sm:mt-2">
                  Try adjusting your search or filters
                </p>
              </div>
            ) : (
              // Results list
              <>
                <div className="mb-3 text-xs text-gray-600 dark:text-gray-400 sm:mb-4 sm:text-sm">
                  Found {users.length} {users.length === 1 ? "user" : "users"}
                </div>
                {users.map((user) => (
                  <UserCard key={user._id} user={user} />
                ))}
              </>
            )}
          </div>
        </main>
      </div>
    </div>
  )
}
