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
        <Search className="h-5 w-5 text-muted-foreground" aria-hidden="true" />
      </div>

      {/* Search Input */}
      <input
        type="text"
        value={searchInput}
        onChange={(e) => setSearchInput(e.target.value)}
        placeholder="Search users by name..."
        className="block w-full rounded-md border border-border bg-card py-2 pl-10 pr-10 text-foreground placeholder:text-muted-foreground focus:border-ring focus:outline-none focus:ring-1 focus:ring-ring"
        aria-label="Search users"
      />

      {/* Clear Button */}
      {searchInput && (
        <button
          type="button"
          onClick={handleClear}
          className="absolute inset-y-0 right-0 flex items-center pr-3 text-muted-foreground hover:text-muted-foreground"
          aria-label="Clear search"
        >
          <X className="h-5 w-5" />
        </button>
      )}
    </div>
  )
}
