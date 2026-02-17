"use client"

import { useState, useEffect } from "react"
import { Search, X } from "lucide-react"
import { useDebounce } from "@/hooks/useDebounce"

interface UserSearchBarProps {
  onSearch: (query: string) => void
}

export function UserSearchBar({ onSearch }: UserSearchBarProps) {
  const [searchInput, setSearchInput] = useState("")
  const debouncedSearch = useDebounce(searchInput, 300)

  // Trigger search when debounced value changes
  useEffect(() => {
    onSearch(debouncedSearch)
  }, [debouncedSearch, onSearch])

  const handleClear = () => {
    setSearchInput("")
  }

  return (
    <div className="relative w-full">
      {/* Search Icon */}
      <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
        <Search className="h-5 w-5 text-gray-400" aria-hidden="true" />
      </div>

      {/* Search Input */}
      <input
        type="text"
        value={searchInput}
        onChange={(e) => setSearchInput(e.target.value)}
        placeholder="Search users by name..."
        className="block w-full rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 py-2 pl-10 pr-10 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
        aria-label="Search users"
      />

      {/* Clear Button */}
      {searchInput && (
        <button
          type="button"
          onClick={handleClear}
          className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-400 hover:text-gray-600"
          aria-label="Clear search"
        >
          <X className="h-5 w-5" />
        </button>
      )}
    </div>
  )
}
