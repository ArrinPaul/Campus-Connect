'use client';

import Link from 'next/link';
import type { Doc } from '@/convex/_generated/dataModel';
import { TrendingUp, MousePointerClick, DollarSign, Target, PlayCircle, PauseCircle, Trash2, Loader2, Clock } from 'lucide-react';
import { format } from 'date-fns';
import { useState } from 'react';
import { useMutation } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { toast } from 'sonner';

type Ad = Doc<'ads'>; // Simplified for display on dashboard
type AdWithAnalytics = Ad & { ctr: number };

type Props = {
    ad: AdWithAnalytics;
};

export function AdCard({ ad }: Props) {
    const updateAd = useMutation(api.ads.updateAd);
    const deleteAd = useMutation(api.ads.deleteAd);
    const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);

    const handleToggleStatus = async () => {
        setIsUpdatingStatus(true);
        const newStatus = ad.status === 'active' ? 'paused' : 'active';
        try {
            await updateAd({ adId: ad._id, status: newStatus });
            toast.success(`Ad ${newStatus} successfully!`);
        } catch (error) {
            toast.error(`Failed to ${newStatus} ad.`, { description: (error as Error).message });
        } finally {
            setIsUpdatingStatus(false);
        }
    };

    const handleDelete = async () => {
        if (!window.confirm(`Are you sure you want to delete "${ad.title}"? This cannot be undone.`)) {
            return;
        }
        setIsDeleting(true);
        try {
            await deleteAd({ adId: ad._id });
            toast.success("Ad deleted successfully!");
        } catch (error) {
            toast.error("Failed to delete ad.", { description: (error as Error).message });
        } finally {
            setIsDeleting(false);
        }
    };

    const statusColor = ad.status === 'active' ? 'text-green-500' : ad.status === 'paused' ? 'text-yellow-500' : 'text-red-500';
    const StatusIcon = ad.status === 'active' ? PlayCircle : PauseCircle;

    return (
        <div className="block p-4 border rounded-lg bg-card transition-colors">
            <div className="flex justify-between items-start mb-3">
                <Link href={ad.linkUrl} target="_blank" rel="noopener noreferrer" className="font-bold text-lg text-primary hover:underline line-clamp-1">
                    {ad.title}
                </Link>
                <div className={`flex items-center gap-1 text-sm font-semibold ${statusColor}`}>
                    <StatusIcon className="h-4 w-4" />
                    {ad.status.charAt(0).toUpperCase() + ad.status.slice(1)}
                </div>
            </div>
            
            <p className="text-sm text-muted-foreground mt-1 line-clamp-2 h-10">{ad.content}</p>

            <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground mt-3 border-t pt-3">
                <div className="flex items-center gap-1">
                    <TrendingUp className="h-3.5 w-3.5" /> {ad.impressions} Impressions
                </div>
                <div className="flex items-center gap-1">
                    <MousePointerClick className="h-3.5 w-3.5" /> {ad.clicks} Clicks
                </div>
                <div className="flex items-center gap-1">
                    <Target className="h-3.5 w-3.5" /> {ad.ctr.toFixed(2)}% CTR
                </div>
                <div className="flex items-center gap-1">
                    <DollarSign className="h-3.5 w-3.5" /> {ad.budget} Budget
                </div>
                {ad.expiresAt && (
                    <div className="flex items-center gap-1">
                        <Clock className="h-3.5 w-3.5" /> Expires {format(new Date(ad.expiresAt), 'MMM d, yyyy')}
                    </div>
                )}
            </div>

            <div className="flex justify-end gap-2 mt-4 border-t pt-3">
                <button 
                    onClick={handleToggleStatus} 
                    disabled={isUpdatingStatus}
                    className="h-9 px-3 btn-press bg-muted/50 text-muted-foreground hover:bg-muted/80 rounded-md text-sm font-semibold flex items-center gap-2 disabled:opacity-50"
                >
                    {isUpdatingStatus && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    {ad.status === 'active' ? 'Pause' : 'Activate'}
                </button>
                 <button 
                    onClick={handleDelete} 
                    disabled={isDeleting}
                    className="h-9 px-3 btn-press bg-destructive text-destructive-foreground hover:bg-destructive/90 rounded-md text-sm font-semibold flex items-center gap-2 disabled:opacity-50"
                >
                    {isDeleting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    <Trash2 className="h-4 w-4" /> Delete
                </button>
            </div>
        </div>
    );
}
