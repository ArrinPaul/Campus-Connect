'use client';

import { useState } from 'react';
import { useMutation } from 'convex/react';
import { api } from '@/convex/_generated/api';
import type { Id } from '@/convex/_generated/dataModel';
import { X, Loader2, Save } from 'lucide-react';
import { toast } from 'sonner';

const CATEGORIES = ['books', 'electronics', 'furniture', 'services', 'other'] as const;
const CONDITIONS = ['new', 'like_new', 'good', 'fair', 'poor'] as const;

const conditionLabels: Record<string, string> = {
    new: 'New',
    like_new: 'Like New',
    good: 'Good',
    fair: 'Fair',
    poor: 'Poor',
};

interface EditListingModalProps {
    listing: {
        _id: Id<'listings'>;
        title: string;
        description: string;
        category: string;
        price: number;
        condition: string;
        images?: string[];
        status: string;
    };
    onClose: () => void;
}

export function EditListingModal({ listing, onClose }: EditListingModalProps) {
    const updateListing = useMutation(api.marketplace.updateListing);
    const [title, setTitle] = useState(listing.title);
    const [description, setDescription] = useState(listing.description);
    const [price, setPrice] = useState(listing.price.toString());
    const [condition, setCondition] = useState(listing.condition);
    const [isSaving, setIsSaving] = useState(false);

    const handleSave = async () => {
        const priceNum = parseFloat(price);
        if (!title.trim()) return toast.error('Title is required');
        if (!description.trim()) return toast.error('Description is required');
        if (isNaN(priceNum) || priceNum <= 0) return toast.error('Valid price is required');

        setIsSaving(true);
        try {
            await updateListing({
                listingId: listing._id,
                title: title.trim(),
                description: description.trim(),
                price: priceNum,
                condition: condition as any,
            });
            toast.success('Listing updated!');
            onClose();
        } catch (err: any) {
            toast.error(err.message || 'Failed to update listing');
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={onClose}>
            <div
                className="bg-background rounded-xl shadow-xl w-full max-w-lg mx-4 max-h-[85vh] flex flex-col"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header */}
                <div className="flex items-center justify-between px-5 py-4 border-b">
                    <h2 className="text-lg font-semibold">Edit Listing</h2>
                    <button onClick={onClose} className="p-1 rounded-md hover:bg-muted">
                        <X className="h-5 w-5" />
                    </button>
                </div>

                {/* Body */}
                <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4">
                    <div>
                        <label className="text-sm font-medium mb-1 block">Title *</label>
                        <input
                            type="text"
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            maxLength={150}
                            className="w-full rounded-md border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
                        />
                    </div>

                    <div>
                        <label className="text-sm font-medium mb-1 block">Description *</label>
                        <textarea
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            rows={4}
                            maxLength={2000}
                            className="w-full rounded-md border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 resize-none"
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="text-sm font-medium mb-1 block">Price ($) *</label>
                            <input
                                type="number"
                                value={price}
                                onChange={(e) => setPrice(e.target.value)}
                                min="0.01"
                                step="0.01"
                                className="w-full rounded-md border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
                            />
                        </div>
                        <div>
                            <label className="text-sm font-medium mb-1 block">Condition</label>
                            <select
                                value={condition}
                                onChange={(e) => setCondition(e.target.value)}
                                className="w-full rounded-md border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
                            >
                                {CONDITIONS.map((c) => (
                                    <option key={c} value={c}>
                                        {conditionLabels[c]}
                                    </option>
                                ))}
                            </select>
                        </div>
                    </div>

                    <div>
                        <label className="text-sm font-medium mb-1 block">Category</label>
                        <p className="text-xs text-muted-foreground capitalize">{listing.category}</p>
                        <p className="text-xs text-muted-foreground mt-1">Category cannot be changed after creation.</p>
                    </div>
                </div>

                {/* Footer */}
                <div className="flex items-center justify-end gap-2 px-5 py-4 border-t">
                    <button
                        onClick={onClose}
                        className="px-4 py-2 rounded-md border text-sm hover:bg-muted"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleSave}
                        disabled={isSaving}
                        className="flex items-center gap-1.5 px-4 py-2 rounded-md bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 disabled:opacity-50"
                    >
                        {isSaving ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                            <Save className="h-4 w-4" />
                        )}
                        Save Changes
                    </button>
                </div>
            </div>
        </div>
    );
}
