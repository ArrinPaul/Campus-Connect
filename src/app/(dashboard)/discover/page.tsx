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
    <div className="mx-auto max-w-7xl px-4 py-8">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Discover Users</h1>
        <p className="mt-2 text-gray-600">
          Find and connect with students, researchers, and faculty
        </p>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-4">
        {/* Sidebar with filters */}
        <aside className="lg:col-span-1">
          <UserFilterPanel onFilterChange={handleFilterChange} />
        </aside>

        {/* Main content area */}
        <main className="lg:col-span-3">
          {/* Search bar */}
          <div className="mb-6">
            <UserSearchBar onSearch={handleSearch} />
          </div>

          {/* Results */}
          <div className="space-y-4">
            {users === undefined ? (
              // Loading state
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
              </div>
            ) : users.length === 0 ? (
              // Empty state
              <div className="rounded-lg border border-gray-200 bg-white p-12 text-center">
                <p className="text-lg font-medium text-gray-900">No users found</p>
                <p className="mt-2 text-gray-600">
                  Try adjusting your search or filters
                </p>
              </div>
            ) : (
              // Results list
              <>
                <div className="mb-4 text-sm text-gray-600">
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
