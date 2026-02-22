'use client';

import { useQuery, useMutation } from 'convex/react';
import { api } from '@/convex/_generated/api';
import type { Id } from '@/convex/_generated/dataModel';
import { notFound } from 'next/navigation';
import { ArrowLeft, Tag, DollarSign, MapPin, Package, Clock, User as UserIcon, CheckCircle, MessageSquare, Loader2 } from 'lucide-react';
import Link from 'next/link';
import { formatDistanceToNow } from 'date-fns';
import { toast } from 'sonner';
import { useState } from 'react';

type PageProps = {
    params: {
        id: Id<'listings'>;
    };
};

export default function ListingDetailPage({ params }: PageProps) {
    const listing = useQuery(api.marketplace.getListing, { listingId: params.id });
    const markAsSold = useMutation(api.marketplace.markAsSold);
    const [isMarkingSold, setIsMarkingSold] = useState(false);
    const currentUser = useQuery(api.users.getCurrentUser);

    const handleMarkAsSold = async () => {
        setIsMarkingSold(true);
        try {
            await markAsSold({ listingId: params.id });
            toast.success("Listing marked as sold!");
        } catch (error) {
            toast.error("Failed to mark as sold.", { description: (error as Error).message });
        } finally {
            setIsMarkingSold(false);
        }
    };

    if (listing === undefined) {
        return <div className="text-center py-16">Loading...</div>;
    }

    if (listing === null) {
        notFound();
    }

    const isSeller = currentUser?._id === listing.sellerId;
    const sellerName = listing.seller?.name || 'Anonymous';
    const sellerAvatar = listing.seller?.avatarUrl;

    return (
        <div className="max-w-4xl mx-auto py-8 px-4">
             <Link href="/marketplace" className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-4">
                <ArrowLeft className="h-4 w-4" />
                Back to marketplace
            </Link>

            <div className="bg-card border rounded-lg p-6">
                <div className="relative h-96 w-full rounded-md bg-muted overflow-hidden mb-6">
                    {listing.images && listing.images.length > 0 ? (
                        <img src={listing.images[0]} alt={listing.title} className="h-full w-full object-cover" />
                    ) : (
                        <div className="flex items-center justify-center h-full text-muted-foreground">No Image</div>
                    )}
                    {listing.status === 'sold' && (
                        <div className="absolute inset-0 flex items-center justify-center bg-background/80 text-foreground font-bold text-2xl">
                            SOLD
                        </div>
                    )}
                </div>

                <h1 className="text-3xl font-bold text-primary mb-2">{listing.title}</h1>
                <p className="text-2xl font-semibold text-foreground mb-4">${listing.price.toFixed(2)}</p>
                
                <div className="flex flex-wrap gap-x-6 gap-y-2 text-sm text-muted-foreground my-4 border-y py-4">
                    <div className="flex items-center gap-1.5"><Tag className="h-4 w-4" /> {listing.category}</div>
                    <div className="flex items-center gap-1.5"><Package className="h-4 w-4" /> {listing.condition}</div>
                    {listing.university && (
                        <div className="flex items-center gap-1.5"><MapPin className="h-4 w-4" /> {listing.university}</div>
                    )}
                    <div className="flex items-center gap-1.5"><Clock className="h-4 w-4" /> Listed {formatDistanceToNow(new Date(listing.createdAt), { addSuffix: true })}</div>
                </div>

                <div>
                    <h3 className="font-bold text-lg mb-2">Description</h3>
                    <p className="whitespace-pre-wrap">{listing.description}</p>
                </div>

                <div className="mt-6 border-t pt-6 flex items-center gap-3">
                    <div className="h-10 w-10 rounded-full bg-muted">
                        {sellerAvatar ? (
                            <img src={sellerAvatar} alt={sellerName} className="h-full w-full rounded-full object-cover" />
                        ) : (
                            <UserIcon className="h-4 w-4" />
                        )}
                    </div>
                    <div>
                        <p className="text-sm text-muted-foreground">Seller</p>
                        <Link href={`/profile/${listing.sellerId}`} className="font-bold hover:underline">{sellerName}</Link>
                    </div>
                </div>

                <div className="mt-6 flex gap-4">
                    {!isSeller ? (
                        <button className="h-10 px-4 btn-press bg-primary text-primary-foreground hover:bg-primary/90 rounded-md text-sm font-semibold flex items-center gap-2">
                            <MessageSquare className="h-4 w-4" /> Contact Seller
                        </button>
                    ) : (
                        <button 
                            onClick={handleMarkAsSold} 
                            disabled={listing.status === 'sold' || isMarkingSold}
                            className="h-10 px-4 btn-press bg-green-500 text-white hover:bg-green-600 rounded-md text-sm font-semibold flex items-center gap-2 disabled:opacity-50"
                        >
                            {isMarkingSold && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            <CheckCircle className="h-4 w-4" /> Mark as Sold
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
}
