'use client';

import { useQuery, useMutation } from 'convex/react';
import { api } from '@/convex/_generated/api';
import type { Id } from '@/convex/_generated/dataModel';
import { notFound } from 'next/navigation';
import { ArrowLeft, Tag, DollarSign, MapPin, Package, Clock, User as UserIcon, CheckCircle, MessageSquare, Loader2, ShoppingCart, XCircle, Check, X, Pencil, Trash2 } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import { formatDistanceToNow } from 'date-fns';
import { toast } from 'sonner';
import { useState } from 'react';
import { EditListingModal } from '@/components/marketplace/EditListingModal';

type PageProps = {
    params: {
        id: Id<'listings'>;
    };
};

export default function ListingDetailPage({ params }: PageProps) {
    const listing = useQuery(api.marketplace.getListing, { listingId: params.id });
    const markAsSold = useMutation(api.marketplace.markAsSold);
    const purchaseListing = useMutation(api.marketplace.purchaseListing);
    const completeTransaction = useMutation(api.marketplace.completeTransaction);
    const cancelTransaction = useMutation(api.marketplace.cancelTransaction);
    const [isMarkingSold, setIsMarkingSold] = useState(false);
    const [isPurchasing, setIsPurchasing] = useState(false);
    const [showPurchaseForm, setShowPurchaseForm] = useState(false);
    const [purchaseMessage, setPurchaseMessage] = useState('');
    const [processingTx, setProcessingTx] = useState<string | null>(null);
    const [showEditModal, setShowEditModal] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);
    const currentUser = useQuery(api.users.getCurrentUser);
    const deleteListing = useMutation(api.marketplace.deleteListing);

    // Get transactions for seller view
    const isSeller = currentUser?._id === listing?.sellerId;
    const transactions = useQuery(
        api.marketplace.getListingTransactions,
        listing && isSeller ? { listingId: listing._id } : 'skip'
    );

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

    const handlePurchase = async () => {
        setIsPurchasing(true);
        try {
            await purchaseListing({
                listingId: params.id,
                message: purchaseMessage.trim() || undefined,
            });
            toast.success("Purchase request sent to the seller!");
            setShowPurchaseForm(false);
            setPurchaseMessage('');
        } catch (error) {
            toast.error((error as Error).message || "Failed to send purchase request.");
        } finally {
            setIsPurchasing(false);
        }
    };

    const handleCompleteTransaction = async (txId: Id<'marketplaceTransactions'>) => {
        setProcessingTx(txId);
        try {
            await completeTransaction({ transactionId: txId });
            toast.success("Transaction completed! Listing marked as sold.");
        } catch (error) {
            toast.error((error as Error).message || "Failed to complete transaction.");
        } finally {
            setProcessingTx(null);
        }
    };

    const handleCancelTransaction = async (txId: Id<'marketplaceTransactions'>) => {
        setProcessingTx(txId);
        try {
            await cancelTransaction({ transactionId: txId });
            toast.success("Transaction cancelled.");
        } catch (error) {
            toast.error((error as Error).message || "Failed to cancel.");
        } finally {
            setProcessingTx(null);
        }
    };

    if (listing === undefined) {
        return <div className="text-center py-16">Loading...</div>;
    }

    if (listing === null) {
        notFound();
    }

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
                        <Image src={listing.images[0]} alt={listing.title} fill className="object-cover" />
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
                    <div className="h-10 w-10 rounded-full bg-muted flex items-center justify-center">
                        {sellerAvatar ? (
                            <Image src={sellerAvatar} alt={sellerName} width={40} height={40} className="h-full w-full rounded-full object-cover" />
                        ) : (
                            <UserIcon className="h-4 w-4" />
                        )}
                    </div>
                    <div>
                        <p className="text-sm text-muted-foreground">Seller</p>
                        <Link href={`/profile/${listing.sellerId}`} className="font-bold hover:underline">{sellerName}</Link>
                    </div>
                </div>

                {/* Action Buttons */}
                <div className="mt-6 flex flex-col gap-4">
                    {!isSeller && listing.status === 'active' && (
                        <>
                            {!showPurchaseForm ? (
                                <button
                                    onClick={() => setShowPurchaseForm(true)}
                                    className="h-10 px-4 btn-press bg-primary text-primary-foreground hover:bg-primary/90 rounded-md text-sm font-semibold flex items-center gap-2 w-fit"
                                >
                                    <ShoppingCart className="h-4 w-4" /> Buy This Item
                                </button>
                            ) : (
                                <div className="border rounded-lg p-4 bg-muted/30">
                                    <h3 className="font-semibold text-sm mb-3">Send Purchase Request</h3>
                                    <p className="text-xs text-muted-foreground mb-3">
                                        The seller will be notified of your interest. Include a message to coordinate pickup/delivery.
                                    </p>
                                    <textarea
                                        value={purchaseMessage}
                                        onChange={(e) => setPurchaseMessage(e.target.value)}
                                        placeholder="Hi! I'm interested in buying this. When/where can we meet?"
                                        rows={3}
                                        maxLength={500}
                                        className="w-full rounded-md border bg-background p-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 resize-none"
                                    />
                                    <div className="flex items-center gap-2 mt-3">
                                        <button
                                            onClick={handlePurchase}
                                            disabled={isPurchasing}
                                            className="flex items-center gap-1.5 px-4 py-2 rounded-md bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 disabled:opacity-50"
                                        >
                                            {isPurchasing ? (
                                                <Loader2 className="h-4 w-4 animate-spin" />
                                            ) : (
                                                <ShoppingCart className="h-4 w-4" />
                                            )}
                                            Confirm Purchase Request
                                        </button>
                                        <button
                                            onClick={() => { setShowPurchaseForm(false); setPurchaseMessage(''); }}
                                            className="px-4 py-2 rounded-md border text-sm hover:bg-muted"
                                        >
                                            Cancel
                                        </button>
                                    </div>
                                </div>
                            )}
                        </>
                    )}

                    {!isSeller && listing.status === 'sold' && (
                        <p className="text-sm text-muted-foreground">This item has been sold.</p>
                    )}

                    {isSeller && (
                        <div className="flex gap-3 flex-wrap">
                            <button
                                onClick={() => setShowEditModal(true)}
                                className="h-10 px-4 btn-press border rounded-md text-sm font-semibold flex items-center gap-2 hover:bg-muted"
                            >
                                <Pencil className="h-4 w-4" /> Edit Listing
                            </button>
                            <button 
                                onClick={handleMarkAsSold} 
                                disabled={listing.status === 'sold' || isMarkingSold}
                                className="h-10 px-4 btn-press bg-green-500 text-white hover:bg-green-600 rounded-md text-sm font-semibold flex items-center gap-2 disabled:opacity-50"
                            >
                                {isMarkingSold && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                <CheckCircle className="h-4 w-4" /> Mark as Sold
                            </button>
                            <button
                                onClick={async () => {
                                    if (!confirm('Delete this listing? This cannot be undone.')) return;
                                    setIsDeleting(true);
                                    try {
                                        await deleteListing({ listingId: listing._id });
                                        toast.success('Listing deleted');
                                        window.location.href = '/marketplace';
                                    } catch (err: any) {
                                        toast.error(err.message || 'Failed to delete');
                                        setIsDeleting(false);
                                    }
                                }}
                                disabled={isDeleting}
                                className="h-10 px-4 btn-press border border-red-200 dark:border-red-900/50 text-red-600 rounded-md text-sm font-semibold flex items-center gap-2 hover:bg-red-500/10 disabled:opacity-50"
                            >
                                {isDeleting ? (
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                ) : (
                                    <Trash2 className="h-4 w-4" />
                                )}
                                Delete
                            </button>
                        </div>
                    )}
                </div>

                {/* Seller: Purchase Requests */}
                {isSeller && transactions && transactions.length > 0 && (
                    <div className="mt-8 border-t pt-6">
                        <h3 className="font-bold text-lg mb-4">Purchase Requests ({transactions.length})</h3>
                        <div className="space-y-3">
                            {transactions.map((tx: any) => (
                                <div key={tx._id} className="flex items-start gap-3 p-4 border rounded-lg bg-background">
                                    {tx.buyer?.profilePicture ? (
                                        <Image
                                            src={tx.buyer.profilePicture}
                                            alt={tx.buyer.name || ''}
                                            width={36}
                                            height={36}
                                            className="h-9 w-9 rounded-full object-cover flex-shrink-0"
                                        />
                                    ) : (
                                        <div className="h-9 w-9 rounded-full bg-muted flex items-center justify-center flex-shrink-0">
                                            <UserIcon className="h-4 w-4" />
                                        </div>
                                    )}
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2">
                                            <Link href={`/profile/${tx.buyerId}`} className="text-sm font-medium hover:underline">
                                                {tx.buyer?.name || 'Unknown'}
                                            </Link>
                                            <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                                                tx.status === 'pending'
                                                    ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400'
                                                    : tx.status === 'completed'
                                                    ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
                                                    : 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400'
                                            }`}>
                                                {tx.status}
                                            </span>
                                        </div>
                                        {tx.message && (
                                            <p className="text-sm text-muted-foreground mt-1">{tx.message}</p>
                                        )}
                                        <p className="text-xs text-muted-foreground mt-1">
                                            ${tx.amount.toFixed(2)} · {formatDistanceToNow(new Date(tx.createdAt), { addSuffix: true })}
                                        </p>
                                    </div>
                                    {tx.status === 'pending' && (
                                        <div className="flex items-center gap-1.5 flex-shrink-0">
                                            <button
                                                onClick={() => handleCompleteTransaction(tx._id)}
                                                disabled={processingTx === tx._id}
                                                className="flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium rounded-md bg-green-600 text-white hover:bg-green-700 disabled:opacity-50"
                                            >
                                                {processingTx === tx._id ? (
                                                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                                ) : (
                                                    <Check className="h-3.5 w-3.5" />
                                                )}
                                                Accept
                                            </button>
                                            <button
                                                onClick={() => handleCancelTransaction(tx._id)}
                                                disabled={processingTx === tx._id}
                                                className="flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium rounded-md border hover:bg-muted disabled:opacity-50"
                                            >
                                                <X className="h-3.5 w-3.5" />
                                                Decline
                                            </button>
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>

            {/* Edit Modal */}
            {showEditModal && (
                <EditListingModal
                    listing={listing}
                    onClose={() => setShowEditModal(false)}
                />
            )}
        </div>
    );
}
