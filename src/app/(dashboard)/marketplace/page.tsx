'use client';

import { useQuery } from '@/lib/api';
import { api } from '@/lib/api';
import { ListingCard } from '../../(components)/marketplace/ListingCard';
import { CreateListingModal } from '@/components/marketplace/CreateListingModal';
import Link from 'next/link';
import { Search, Store, ShoppingBag } from 'lucide-react';
import { useState } from 'react';

const ListingCardSkeleton = () => <div className="p-4 border border-hairline-soft rounded-xl bg-surface-soft h-[320px] animate-pulse" />;

export default function MarketplacePage() {
 const [searchQuery, setSearchQuery] = useState('');
 const [categoryFilter, setCategoryFilter] = useState('all');
 const [showCreateModal, setShowCreateModal] = useState(false);

 const listings = useQuery(api.marketplace.getListings, { 
 // No direct query for search, will filter on client side if necessary, or backend needs an update
 category: categoryFilter === 'all' ? undefined : categoryFilter,
 });

 const filteredListings = listings?.filter((listing: any) => 
 searchQuery ? (
 listing.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
 listing.description.toLowerCase().includes(searchQuery.toLowerCase())
 ) : true
 );

 return (
 <div className="w-full bg-canvas min-h-screen">
 {/* Header Section */}
 <section className="bg-canvas py-section-sm px-base md:px-xl border-b border-hairline-soft">
 <div className="max-w-6xl mx-auto flex flex-col md:flex-row md:items-end justify-between gap-xl">
 <div className="max-w-2xl flex items-center gap-md">
 <div className="w-14 h-14 bg-surface-soft rounded-circle flex items-center justify-center shrink-0 border border-hairline">
 <Store className="w-7 h-7 text-ink-deep" />
 </div>
 <div>
 <h1 className="text-display-lg text-ink-deep mb-xs">Marketplace.</h1>
 <p className="text-subtitle-md text-ink">Buy and sell items within your campus</p>
 </div>
 </div>
 <div className="flex gap-sm w-full md:w-auto">
 <button
 onClick={() => setShowCreateModal(true)}
 className="button-buy-cta flex-1 md:flex-none"
 >
 Post Listing
 </button>
 </div>
 </div>
 </section>

 {/* Content Section */}
 <section className="py-section-sm px-base md:px-xl">
 <div className="w-full max-w-6xl mx-auto space-y-xl">
 
 {/* Search and Filter Controls */}
 <div className="flex flex-col md:flex-row gap-sm items-center justify-between pb-md border-b border-hairline">
 <div className="relative w-full md:max-w-md group">
 <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-steel group-focus-within:text-primary transition-colors" />
 <input
 type="text"
 value={searchQuery}
 onChange={(e) => setSearchQuery(e.target.value)}
 placeholder="Search listings by title..."
 className="w-full pl-12 pr-4 h-[48px] bg-surface-soft border border-hairline rounded-full text-body-md focus:outline-none focus:border-2 focus:border-fb-blue focus:bg-canvas transition-all text-ink placeholder:text-steel"
 />
 </div>
 
 <div className="flex items-center gap-2 w-full md:w-auto bg-surface-soft rounded-lg p-xs border border-hairline shrink-0">
 <select 
 value={categoryFilter} 
 onChange={(e) => setCategoryFilter(e.target.value)}
 className="text-body-sm-bold text-ink bg-transparent px-3 py-1.5 focus:outline-none appearance-none cursor-pointer"
 >
 <option value="all">All Categories</option>
 <option value="books">Books</option>
 <option value="electronics">Electronics</option>
 <option value="furniture">Furniture</option>
 <option value="services">Services</option>
 <option value="other">Other</option>
 </select>
 </div>
 </div>

 <div className="space-y-md">
 {listings === undefined && (
 <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-lg">
 {[...Array(8)].map((_, i) => <ListingCardSkeleton key={i} />)}
 </div>
 )}

 {filteredListings && filteredListings.length > 0 && (
 <div className="text-caption-bold text-steel uppercase tracking-wide">
 {filteredListings.length} {filteredListings.length === 1 ? 'Listing' : 'Listings'}
 </div>
 )}

 <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-lg">
 {filteredListings?.map((listing: any) => (
 <ListingCard key={listing._id} listing={listing as any} />
 ))}
 </div>

 {filteredListings?.length === 0 && (
 <div className="text-center py-section bg-surface-soft rounded-xxxl border border-hairline-soft">
 <ShoppingBag className="w-16 h-16 text-steel/50 mx-auto mb-md" />
 <h3 className="text-heading-lg text-ink-deep mb-sm">No listings found</h3>
 <p className="text-body-md text-steel max-w-sm mx-auto mb-xl">
 Try adjusting your search or category filters.
 </p>
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
