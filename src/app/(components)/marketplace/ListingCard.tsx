'use client';

import Link from 'next/link';
import { OptimizedImage } from '@/components/ui/OptimizedImage';
import type { Doc } from '@/lib/api';
import { Tag, DollarSign, MapPin, Package, Clock, User as UserIcon } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

type Listing = Doc<'listings'> & {
    seller: {
        name: string | null;
        username: string | null;
        avatarUrl: string | null;
    } | null;
};

type Props = {
    listing: Listing;
};

export function ListingCard({ listing }: Props) {
    const sellerName = listing.seller?.name || 'Anonymous';
    const sellerAvatar = listing.seller?.avatarUrl;

    return (
        <Link href={`/marketplace/${listing._id}`} className="block p-4 border border-border rounded-lg bg-card hover:bg-surface-hover transition-colors shadow-sm">
            <div className="relative h-48 w-full rounded-lg bg-muted overflow-hidden border border-border">
                {listing.images && listing.images.length > 0 ? (
                    <OptimizedImage src={listing.images[0]} alt={listing.title} fill className="object-cover" sizes="(max-width: 768px) 100vw, 400px" />
                ) : (
                    <div className="flex items-center justify-center h-full text-muted-foreground">No Image</div>
                )}
                {listing.status === 'sold' && (
                    <div className="absolute inset-0 flex items-center justify-center bg-background/80 text-foreground font-bold text-xl">
                        SOLD
                    </div>
                )}
            </div>
            <div className="mt-3">
                <h3 className="font-bold text-[17px] text-primary hover:underline line-clamp-1 leading-tight">{listing.title}</h3>
                <p className="text-[13px] text-muted-foreground mt-1.5 line-clamp-2 h-10 leading-relaxed">{listing.description}</p>
                
                <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground mt-3 font-semibold">
                    <div className="flex items-center gap-1">
                        <DollarSign className="h-3.5 w-3.5" /> {(listing.price / 100).toFixed(2)}
                    </div>
                    <div className="flex items-center gap-1">
                        <Tag className="h-3.5 w-3.5" /> {listing.category}
                    </div>
                    <div className="flex items-center gap-1">
                        <Package className="h-3.5 w-3.5" /> {listing.condition}
                    </div>
                    {listing.university && (
                        <div className="flex items-center gap-1">
                            <MapPin className="h-3.5 w-3.5" /> {listing.university}
                        </div>
                    )}
                </div>

                <div className="flex items-center gap-2 mt-3 text-xs text-muted-foreground border-t pt-3">
                    {sellerAvatar ? (
                        <OptimizedImage src={sellerAvatar} alt={sellerName} width={20} height={20} isAvatar className="h-5 w-5 rounded-full object-cover" />
                    ) : (
                        <UserIcon className="h-4 w-4" />
                    )}
                    <p>{sellerName}</p>
                    <span className="mx-1">â€¢</span>
                    <p>Listed {formatDistanceToNow(new Date(listing.createdAt), { addSuffix: true })}</p>
                </div>
            </div>
        </Link>
    );
}

