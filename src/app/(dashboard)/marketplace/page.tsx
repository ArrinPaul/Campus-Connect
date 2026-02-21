"use client"

import { useQuery } from "convex/react"
import { api } from "@/convex/_generated/api"
import { useState } from "react"
import Link from "next/link"
import { CreateListingModal } from "@/components/marketplace/CreateListingModal"
import Image from "next/image"

const CATEGORIES = [
  { key: "all", label: "All" },
  { key: "books", label: "Books" },
  { key: "electronics", label: "Electronics" },
  { key: "furniture", label: "Furniture" },
  { key: "services", label: "Services" },
  { key: "other", label: "Other" },
]

const CONDITION_LABELS: Record<string, string> = {
  new: "New",
  like_new: "Like New",
  good: "Good",
  fair: "Fair",
  poor: "Poor",
}

function ListingCard({ listing }: { listing: any }) {
  return (
    <Link
      href={`/marketplace/${listing._id}`}
      className="group rounded-xl border bg-card hover:shadow-md transition-shadow overflow-hidden flex flex-col"
    >
      {listing.images?.[0] ? (
        <div className="relative aspect-[4/3] overflow-hidden bg-muted">
          <Image
            src={listing.images[0]}
            alt={listing.title}
            fill={true}
            className="object-cover group-hover:scale-105 transition-transform duration-300"
          />
        </div>
      ) : (
        <div className="aspect-[4/3] bg-muted flex items-center justify-center text-muted-foreground text-3xl">
          📦
        </div>
      )}
      <div className="p-3 space-y-1 flex-1 flex flex-col">
        <p className="font-semibold text-sm line-clamp-2">{listing.title}</p>
        <p className="text-lg font-bold text-primary">
          {listing.price === 0 ? "Free" : `$${(listing.price / 100).toFixed(2)}`}
        </p>
        <div className="flex gap-1.5 mt-auto pt-2">
          <span className="text-xs bg-muted px-1.5 py-0.5 rounded-full">
            {CONDITION_LABELS[listing.condition] ?? listing.condition}
          </span>
          {listing.university && (
            <span className="text-xs bg-muted px-1.5 py-0.5 rounded-full truncate max-w-[100px]">
              {listing.university}
            </span>
          )}
        </div>
      </div>
    </Link>
  )
}

export default function MarketplacePage() {
  const [category, setCategory] = useState<string | undefined>(undefined)
  const [minPrice, setMinPrice] = useState<string>("")
  const [maxPrice, setMaxPrice] = useState<string>("")
  const [showCreate, setShowCreate] = useState(false)

  const listings = useQuery(api.marketplace.getListings, {
    category: category ?? undefined,
    minPrice: minPrice ? Math.round(parseFloat(minPrice) * 100) : undefined,
    maxPrice: maxPrice ? Math.round(parseFloat(maxPrice) * 100) : undefined,
  })

  return (
    <div className="max-w-5xl mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Campus Marketplace</h1>
          <p className="text-muted-foreground text-sm mt-1">Buy and sell with fellow students.</p>
        </div>
        <button
          onClick={() => setShowCreate(true)}
          className="px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors"
        >
          + Post Listing
        </button>
      </div>

      {/* Category tabs */}
      <div className="flex gap-2 flex-wrap">
        {CATEGORIES.map((c) => (
          <button
            key={c.key}
            onClick={() => setCategory(c.key === "all" ? undefined : c.key)}
            className={`px-3 py-1.5 rounded-full text-sm font-medium border transition-colors ${
              (category ?? "all") === c.key
                ? "bg-primary text-primary-foreground border-primary"
                : "bg-background border-border hover:bg-muted"
            }`}
          >
            {c.label}
          </button>
        ))}
      </div>

      {/* Price filter */}
      <div className="flex gap-3 items-center">
        <span className="text-sm text-muted-foreground">Price:</span>
        <input
          type="number"
          min="0"
          placeholder="Min $"
          value={minPrice}
          onChange={(e) => setMinPrice(e.target.value)}
          className="w-24 rounded-lg border bg-background px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
        />
        <span className="text-muted-foreground">–</span>
        <input
          type="number"
          min="0"
          placeholder="Max $"
          value={maxPrice}
          onChange={(e) => setMaxPrice(e.target.value)}
          className="w-24 rounded-lg border bg-background px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
        />
        {(minPrice || maxPrice) && (
          <button
            onClick={() => { setMinPrice(""); setMaxPrice("") }}
            className="text-xs text-muted-foreground hover:text-foreground"
          >
            Clear
          </button>
        )}
      </div>

      {/* Listings grid */}
      {listings === undefined ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="rounded-xl border bg-muted animate-pulse aspect-[3/4]" />
          ))}
        </div>
      ) : listings.length === 0 ? (
        <div className="text-center py-16 border rounded-xl bg-muted/20">
          <p className="text-4xl mb-3">🛍️</p>
          <p className="font-semibold">No listings found</p>
          <p className="text-sm text-muted-foreground mt-1">
            {category ? `No ${category} for sale right now.` : "Be the first to post something!"}
          </p>
          <button
            onClick={() => setShowCreate(true)}
            className="mt-4 px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors"
          >
            Post a Listing
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          {listings.map((listing) => (
            <ListingCard key={listing._id} listing={listing} />
          ))}
        </div>
      )}

      {showCreate && <CreateListingModal onClose={() => setShowCreate(false)} />}
    </div>
  )
}
