'use client';

import { useState } from 'react';
import { useMutation } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { Input, Textarea, FormButton } from '../../../(components)/settings/SettingComponents';

export default function CreateCommunityPage() {
    const router = useRouter();
    const createCommunity = useMutation(api.communities.createCommunity);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [formData, setFormData] = useState({
        name: '',
        description: '',
        type: 'public' as 'public' | 'private' | 'secret',
        category: 'Academic',
    });

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        setFormData(prev => ({ ...prev, [e.target.name]: e.target.value as any }));
    };
    
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!formData.name.trim() || !formData.description.trim()) {
            toast.error("Name and description are required.");
            return;
        }

        setIsSubmitting(true);
        try {
            const result = await createCommunity(formData);
            toast.success("Community created successfully!");
            router.push(`/c/${result.slug}`);
        } catch (error) {
            toast.error("Failed to create community.", { description: (error as Error).message });
            setIsSubmitting(false);
        }
    };

    return (
        <div className="max-w-2xl mx-auto py-8 px-4">
            <Link href="/communities" className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-4">
                <ArrowLeft className="h-4 w-4" />
                Back to Communities
            </Link>
            
            <h1 className="text-3xl font-bold mb-6">Create a new community</h1>

            <form onSubmit={handleSubmit} className="space-y-6">
                <Input label="Community Name" name="name" value={formData.name} onChange={handleChange} placeholder="e.g. AI Researchers" />
                <Textarea label="Description" name="description" value={formData.description} onChange={handleChange} placeholder="What is this community about?" maxLength={1000} />
                
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

                <div className="flex justify-end">
                    <FormButton isSubmitting={isSubmitting} text="Create Community" />
                </div>
            </form>
        </div>
    );
}
