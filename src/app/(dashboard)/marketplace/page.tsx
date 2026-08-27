'use client';

import { useQuery } from '@/lib/api';
import { api } from '@/lib/api';
import { ListingCard } from '../../(components)/marketplace/ListingCard';
import { CreateListingModal } from '@/components/marketplace/CreateListingModal';
import Link from 'next/link';
import { Search, Store, ShoppingBag, Plus, Sparkles, X } from 'lucide-react';
import { useState } from 'react';
import { cn } from '@/lib/utils';

const CATEGORIES = [
  { key: 'all', label: 'All' },
  { key: 'books', label: 'Books' },
  { key: 'electronics', label: 'Electronics' },
  { key: 'furniture', label: 'Furniture' },
  { key: 'services', label: 'Services' },
  { key: 'other', label: 'Other' },
];

const ListingCardSkeleton = () => (
  <div className="p-4 border border-hairline rounded-2xl bg-surface-soft h-[300px] animate-pulse" />
);

export default function MarketplacePage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [showCreateModal, setShowCreateModal] = useState(false);

  const listings = useQuery(api.marketplace.getListings, { 
    category: categoryFilter === 'all' ? undefined : categoryFilter,
  });

  const filteredListings = listings?.filter((listing: any) => 
    searchQuery ? (
      listing.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      listing.description?.toLowerCase().includes(searchQuery.toLowerCase())
    ) : true
  );

  const hasActiveFilters = searchQuery.length > 0 || categoryFilter !== 'all';

  return (
    <div className="w-full bg-canvas min-h-screen pb-16">
      {/* Header Section */}
      <section className="bg-surface-soft py-6 px-4 md:px-8 border-b border-hairline shadow-sm">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-heading-lg font-bold text-ink-deep mb-1">Marketplace</h1>
            <p className="text-sm text-slate mt-1 max-w-xl">
              Buy, sell, and exchange books, electronics, and services safely within campus.
            </p>
          </div>
          <button
            onClick={() => setShowCreateModal(true)}
            className="flex items-center gap-1.5 rounded-full bg-primary px-5 py-2.5 text-xs font-bold text-white shadow-md hover:bg-primary/90 active:scale-[0.97] transition-all shrink-0 cursor-pointer"
          >
            <Plus size={16} /> Post Listing
          </button>
        </div>
      </section>

      {/* Content Section */}
      <section className="pt-6 px-4 md:px-8">
        <div className="w-full max-w-6xl mx-auto space-y-6">
          {/* Controls Row */}
          <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
            {/* Search Bar */}
            <div className="relative w-full md:max-w-md group">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate group-focus-within:text-primary transition-colors" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search items, textbooks, gadgets..."
                className="w-full pl-11 pr-10 h-11 rounded-full border border-hairline bg-surface-soft text-[15px] text-ink-deep placeholder:text-slate focus:outline-none focus:border-primary focus:bg-canvas transition-all shadow-sm"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 p-1 rounded-full hover:bg-canvas text-slate"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              )}
            </div>

            {/* Category Pill Tabs */}
            <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none w-full md:w-auto">
              {CATEGORIES.map((cat) => (
                <button
                  key={cat.key}
                  onClick={() => setCategoryFilter(cat.key)}
                  className={cn(
                    "px-4 py-1.5 rounded-full text-xs font-semibold transition-all shrink-0 cursor-pointer active:scale-[0.96]",
                    categoryFilter === cat.key
                      ? "bg-primary text-white shadow-sm"
                      : "bg-surface-soft text-slate border border-hairline hover:border-primary/40 hover:text-primary"
                  )}
                >
                  {cat.label}
                </button>
              ))}
            </div>
          </div>

          {/* Active Filters Bar */}
          {hasActiveFilters && (
            <div className="flex items-center gap-2 text-xs text-slate">
              <span>Active filters:</span>
              {categoryFilter !== 'all' && (
                <span className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary capitalize">
                  {categoryFilter}
                  <X size={12} className="cursor-pointer hover:opacity-80" onClick={() => setCategoryFilter('all')} />
                </span>
              )}
              {searchQuery && (
                <span className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
                  &quot;{searchQuery}&quot;
                  <X size={12} className="cursor-pointer hover:opacity-80" onClick={() => setSearchQuery('')} />
                </span>
              )}
              <button
                onClick={() => { setCategoryFilter('all'); setSearchQuery(''); }}
                className="text-xs text-primary hover:underline ml-2 font-semibold"
              >
                Reset
              </button>
            </div>
          )}

          {/* Listings Grid */}
          <div className="space-y-4">
            {listings === undefined ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                {[...Array(8)].map((_, i) => <ListingCardSkeleton key={i} />)}
              </div>
            ) : filteredListings && filteredListings.length > 0 ? (
              <>
                <div className="text-xs font-bold text-slate uppercase tracking-wider">
                  {filteredListings.length} {filteredListings.length === 1 ? 'Listing' : 'Listings'}
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                  {filteredListings.map((listing: any) => (
                    <div key={listing._id} className="transition-transform duration-200 hover:-translate-y-1">
                      <ListingCard listing={listing as any} />
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <div className="text-center py-16 bg-surface-soft rounded-2xl border border-hairline max-w-lg mx-auto">
                <ShoppingBag className="h-12 w-12 mx-auto mb-3 text-slate opacity-40" />
                <h3 className="text-base font-semibold text-ink-deep">No listings found</h3>
                <p className="text-xs text-slate mt-1 max-w-xs mx-auto">
                  {hasActiveFilters
                    ? 'Try adjusting your search query or category filters.'
                    : 'Be the first to list an item for sale!'}
                </p>
                {hasActiveFilters && (
                  <button
                    onClick={() => { setSearchQuery(''); setCategoryFilter('all'); }}
                    className="mt-4 rounded-full border border-hairline px-4 py-1.5 text-xs font-semibold text-ink-deep hover:bg-canvas transition-colors"
                  >
                    Clear Filters
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      </section>

      {showCreateModal && (
        <CreateListingModal onClose={() => setShowCreateModal(false)} />
      )}
    </div>
  );
}

