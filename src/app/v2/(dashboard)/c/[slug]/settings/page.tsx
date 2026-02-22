'use client';

import { Suspense, useState, useEffect } from 'react';
import { useQuery, useMutation } from 'convex/react';
import { api } from '@/convex/_generated/api';
import type { Id } from '@/convex/_generated/dataModel';
import { notFound, useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Loader2 } from 'lucide-react';
import { SettingsSection, Input, Textarea, FormButton } from '../../../../(components)/settings/SettingComponents';
import { toast } from 'sonner';

type PageProps = {
    params: {
        slug: string;
    };
};

const CommunitySettingsPageSkeleton = () => (
    <div className="max-w-4xl mx-auto py-8 px-4">
        <div className="h-10 w-48 bg-muted/50 rounded-md animate-pulse mb-6" />
        <div className="space-y-6">
            <div className="h-24 w-full bg-muted/50 rounded-md animate-pulse" />
            <div className="h-24 w-full bg-muted/50 rounded-md animate-pulse" />
            <div className="h-10 w-32 ml-auto bg-primary/20 rounded-md animate-pulse" />
        </div>
    </div>
);

function CommunitySettingsPageContent({ slug }: { slug: string }) {
    const router = useRouter();
    const community = useQuery(api.communities.getCommunity, { slug });
    const updateCommunity = useMutation(api.communities.updateCommunity);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [formData, setFormData] = useState({
        name: '',
        description: '',
        type: 'public' as 'public' | 'private' | 'secret',
        category: 'Academic',
    });

    useEffect(() => {
        if (community) {
            setFormData({
                name: community.name,
                description: community.description,
                type: community.type,
                category: community.category,
            });
        }
    }, [community]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        setFormData(prev => ({ ...prev, [e.target.name]: e.target.value as any }));
    };
    
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);
        try {
            await updateCommunity({
                communityId: community!._id,
                ...formData,
            });
            toast.success("Community settings updated successfully!");
            // Refresh the page to reflect slug changes if any
            if (formData.name !== community?.name) {
                router.push(`/c/${community?.slug}`); // Redirect back to community page, slug might have changed
            }
        } catch (error) {
            toast.error("Failed to update community settings.", { description: (error as Error).message });
        } finally {
            setIsSubmitting(false);
        }
    };

    if (community === undefined) {
        return <CommunitySettingsPageSkeleton />;
    }

    if (community === null) {
        notFound();
    }

    // Only owner or admin can access settings
    if (community.viewerRole !== 'owner' && community.viewerRole !== 'admin') {
        return (
            <div className="max-w-xl mx-auto py-16 text-center text-muted-foreground">
                <h3 className="text-xl font-semibold">Access Denied</h3>
                <p className="mt-2">You do not have permission to view these settings.</p>
                <Link href={`/c/${slug}`} className="mt-4 inline-flex items-center gap-2 text-primary hover:underline">
                    <ArrowLeft className="h-4 w-4" /> Go back to community
                </Link>
            </div>
        );
    }

    return (
        <form onSubmit={handleSubmit} className="max-w-4xl mx-auto py-8 px-4">
            <Link href={`/c/${slug}`} className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-4">
                <ArrowLeft className="h-4 w-4" />
                Back to {community.name}
            </Link>
            
            <h1 className="text-3xl font-bold mb-6">Community Settings</h1>

            <SettingsSection title="General Information" description="Update your community's name, description, and type.">
                <Input label="Community Name" name="name" value={formData.name} onChange={handleChange} placeholder="Community Name" />
                <Textarea label="Description" name="description" value={formData.description} onChange={handleChange} placeholder="What is this community about?" />
                <div>
                    <label className="block text-sm font-medium text-foreground">Type</label>
                    <p className="text-xs text-muted-foreground mb-2">Public is visible to everyone. Private requires approval to join. Secret is invite-only and hidden.</p>
                    <select name="type" value={formData.type} onChange={handleChange} className="w-full px-3 py-2 text-sm bg-muted/50 rounded-md focus:outline-none focus:ring-1 focus:ring-primary">
                        <option value="public">Public</option>
                        <option value="private">Private</option>
                        <option value="secret">Secret</option>
                    </select>
                </div>
                 <div>
                    <label className="block text-sm font-medium text-foreground">Category</label>
                     <select name="category" value={formData.category} onChange={handleChange} className="w-full mt-1 px-3 py-2 text-sm bg-muted/50 rounded-md focus:outline-none focus:ring-1 focus:ring-primary">
                        <option>Academic</option>
                        <option>Research</option>
                        <option>Social</option>
                        <option>Sports</option>
                        <option>Clubs</option>
                        <option>Technology</option>
                        <option>Arts</option>
                        <option>Other</option>
                    </select>
                </div>
            </SettingsSection>
            
            {/* TODO: Add sections for members management, rules, etc. */}

            <div className="flex justify-end">
                <FormButton isSubmitting={isSubmitting} />
            </div>
        </form>
    );
}

export default function CommunitySettingsPage({ params }: PageProps) {
    return (
        <Suspense fallback={<CommunitySettingsPageSkeleton />}>
            <CommunitySettingsPageContent slug={params.slug} />
        </Suspense>
    );
}
