'use client';

import { useQuery } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { ListingCard } from '../../(components)/marketplace/ListingCard';
import { CreateListingModal } from '@/components/marketplace/CreateListingModal';
import Link from 'next/link';
import { Search, Plus } from 'lucide-react';
import { useState } from 'react';

const ListingCardSkeleton = () => <div className="p-4 border rounded-lg bg-card h-80 animate-pulse" />;

export default function MarketplacePage() {
    const [searchQuery, setSearchQuery] = useState('');
    const [categoryFilter, setCategoryFilter] = useState('all');
    const [showCreateModal, setShowCreateModal] = useState(false);

    const listings = useQuery(api.marketplace.getListings, { 
        // No direct query for search, will filter on client side if necessary, or backend needs an update
        category: categoryFilter === 'all' ? undefined : categoryFilter,
    });

    const filteredListings = listings?.filter(listing => 
        searchQuery ? (
            listing.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
            listing.description.toLowerCase().includes(searchQuery.toLowerCase())
        ) : true
    );

    return (
        <div className="max-w-6xl mx-auto py-8 px-4">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
                <h1 className="text-3xl font-bold">Campus Marketplace</h1>
                <div className="flex gap-2">
                     <button onClick={() => setShowCreateModal(true)} className="h-10 py-2 px-4 btn-press bg-primary text-primary-foreground hover:bg-primary/90 rounded-md text-sm font-semibold">
                        Post Listing
                    </button>
                </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-4 mb-6">
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                    <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="Search listings by title or description..."
                        className="w-full pl-10 pr-4 py-2.5 text-base bg-muted/50 rounded-full focus:outline-none focus:ring-1 focus:ring-primary"
                    />
                </div>
                <select 
                    value={categoryFilter} 
                    onChange={(e) => setCategoryFilter(e.target.value)}
                    className="w-full sm:w-auto px-3 py-2.5 text-base bg-muted/50 rounded-full focus:outline-none focus:ring-1 focus:ring-primary"
                >
                    <option value="all">All Categories</option>
                    <option value="books">Books</option>
                    <option value="electronics">Electronics</option>
                    <option value="furniture">Furniture</option>
                    <option value="services">Services</option>
                    <option value="other">Other</option>
                </select>
            </div>


            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                 {listings === undefined && (
                    [...Array(5)].map((_, i) => <ListingCardSkeleton key={i} />)
                )}
                {filteredListings?.map(listing => (
                    <ListingCard key={listing._id} listing={listing as any} />
                ))}
                {filteredListings?.length === 0 && (
                    <div className="text-center py-16 col-span-full">
                        <h3 className="text-lg font-semibold">No listings found</h3>
                        <p className="text-muted-foreground mt-2">
                            Try adjusting your search or category filters.
                        </p>
                    </div>
                )}
            </div>

            {showCreateModal && (
                <CreateListingModal onClose={() => setShowCreateModal(false)} />
            )}
        </div>
    );
}
