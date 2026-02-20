"use client"

import { useQuery, useMutation } from "convex/react"
import { api } from "@convex/_generated/api"
import { useState } from "react"
import { useParams, useRouter } from "next/navigation"
import Link from "next/link"

const CONDITION_LABELS: Record<string, string> = {
  new: "New",
  like_new: "Like New",
  good: "Good",
  fair: "Fair",
  poor: "Poor",
}

export default function ListingDetailPage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()
  const listing = useQuery(api.marketplace.getListing, { listingId: id as any })
  const markAsSold = useMutation(api.marketplace.markAsSold)
  const deleteListing = useMutation(api.marketplace.deleteListing)
  const [activeImage, setActiveImage] = useState(0)
  const [loading, setLoading] = useState(false)

  if (listing === undefined) {
    return <div className="p-8 text-center text-muted-foreground">Loading…</div>
  }
  if (listing === null) {
    return (
      <div className="p-8 text-center">
        <p className="text-lg font-semibold">Listing not found</p>
        <Link href="/marketplace" className="text-primary text-sm mt-2 inline-block hover:underline">
          ← Back to Marketplace
        </Link>
      </div>
    )
  }

  const images = listing.images ?? []

  const handleMarkSold = async () => {
    if (!confirm("Mark this listing as sold?")) return
    setLoading(true)
    try {
      await markAsSold({ listingId: id as any })
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async () => {
    if (!confirm("Delete this listing? This cannot be undone.")) return
    setLoading(true)
    try {
      await deleteListing({ listingId: id as any })
      router.push("/marketplace")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-4xl mx-auto p-6">
      <Link href="/marketplace" className="text-sm text-muted-foreground hover:text-foreground flex items-center gap-1 mb-6">
        ← Marketplace
      </Link>

      <div className="grid md:grid-cols-2 gap-8">
        {/* Image gallery */}
        <div className="space-y-3">
          <div className="aspect-square rounded-xl overflow-hidden bg-muted">
            {images.length > 0 ? (
              <img
                src={images[activeImage]}
                alt={listing.title}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-muted-foreground text-6xl">
                📦
              </div>
            )}
          </div>
          {images.length > 1 && (
            <div className="flex gap-2">
              {images.map((img: string, i: number) => (
                <button
                  key={i}
                  onClick={() => setActiveImage(i)}
                  className={`h-16 w-16 rounded-lg overflow-hidden border-2 transition-colors ${
                    activeImage === i ? "border-primary" : "border-transparent"
                  }`}
                >
                  <img src={img} alt="" className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Details */}
        <div className="space-y-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xs bg-muted px-2 py-0.5 rounded-full">{listing.category}</span>
              {listing.status === "sold" && (
                <span className="text-xs bg-red-100 text-red-700 px-2 py-0.5 rounded-full dark:bg-red-900 dark:text-red-400">
                  SOLD
                </span>
              )}
            </div>
            <h1 className="text-2xl font-bold">{listing.title}</h1>
            <p className="text-3xl font-bold text-primary mt-2">
              {listing.price === 0 ? "Free" : `$${(listing.price / 100).toFixed(2)}`}
            </p>
          </div>

          <div className="flex gap-2 text-sm">
            <span className="bg-muted px-2 py-1 rounded-full">
              Condition: <strong>{CONDITION_LABELS[listing.condition]}</strong>
            </span>
            {listing.university && (
              <span className="bg-muted px-2 py-1 rounded-full">{listing.university}</span>
            )}
          </div>

          <div>
            <h3 className="font-semibold mb-1">Description</h3>
            <p className="text-sm text-muted-foreground whitespace-pre-wrap">{listing.description}</p>
          </div>

          {/* Seller info */}
          {listing.seller && (
            <div className="rounded-xl border p-3 flex items-center gap-3">
              {listing.seller.avatarUrl ? (
                <img
                  src={listing.seller.avatarUrl}
                  alt={listing.seller.name}
                  className="h-10 w-10 rounded-full object-cover"
                />
              ) : (
                <div className="h-10 w-10 rounded-full bg-muted flex items-center justify-center text-sm font-bold">
                  {listing.seller.name?.[0] ?? "?"}
                </div>
              )}
              <div>
                <p className="font-medium text-sm">{listing.seller.name}</p>
                {listing.seller.username && (
                  <p className="text-xs text-muted-foreground">@{listing.seller.username}</p>
                )}
              </div>
              <Link
                href={`/messages?newDm=${listing.seller.username}`}
                className="ml-auto px-3 py-1.5 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors"
              >
                Message Seller
              </Link>
            </div>
          )}

          {/* Seller actions */}
          {listing.status === "active" && (
            <div className="flex gap-3 pt-2">
              <button
                onClick={handleMarkSold}
                disabled={loading}
                className="flex-1 py-2 rounded-lg border text-sm font-medium hover:bg-muted disabled:opacity-50 transition-colors"
              >
                Mark as Sold
              </button>
              <button
                onClick={handleDelete}
                disabled={loading}
                className="flex-1 py-2 rounded-lg border border-red-200 text-red-600 text-sm font-medium hover:bg-red-50 disabled:opacity-50 transition-colors"
              >
                {loading ? "…" : "Delete"}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
