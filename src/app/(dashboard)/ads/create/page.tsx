'use client';

import { useState } from 'react';
import { useMutation, useQuery } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { ArrowLeft, Loader2 } from 'lucide-react';
import Link from 'next/link';

// Reusing form components
import { Input, Textarea, FormButton, SettingsSection } from '../../../(components)/settings/SettingComponents';
import { Id } from '@/convex/_generated/dataModel';

export default function CreateAdPage() {
    const router = useRouter();
    const createAd = useMutation(api.ads.createAd);
    const currentUser = useQuery(api.users.getCurrentUser);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [formData, setFormData] = useState({
        title: '',
        content: '',
        imageUrl: '',
        linkUrl: '',
        budget: 100, // Default budget
        targetUniversity: '',
        targetRole: '' as 'Student' | 'Research Scholar' | 'Faculty' | '',
        targetSkills: [] as string[],
        expiresAt: '', // Date string for input
    });

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        if (name === 'budget') {
            setFormData(prev => ({ ...prev, [name]: parseFloat(value) }));
        } else {
            setFormData(prev => ({ ...prev, [name]: value }));
        }
    };

    const handleSkillChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const skillsArray = e.target.value.split(',').map(s => s.trim()).filter(Boolean);
        setFormData(prev => ({ ...prev, targetSkills: skillsArray }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        // Basic validation
        if (!formData.title.trim() || !formData.content.trim() || !formData.linkUrl.trim() || formData.budget <= 0) {
            toast.error("Please fill in all required fields.");
            return;
        }

        setIsSubmitting(true);
        try {
            const expiresAtTimestamp = formData.expiresAt ? new Date(formData.expiresAt).getTime() : undefined;
            await createAd({
                title: formData.title.trim(),
                content: formData.content.trim(),
                imageUrl: formData.imageUrl.trim() || undefined,
                linkUrl: formData.linkUrl.trim(),
                budget: formData.budget,
                targetUniversity: formData.targetUniversity.trim() || undefined,
                targetRole: formData.targetRole === '' ? undefined : formData.targetRole,
                targetSkills: formData.targetSkills.length > 0 ? formData.targetSkills : undefined,
                expiresAt: expiresAtTimestamp,
            });
            toast.success("Ad created successfully!");
            router.push('/ads/dashboard');
        } catch (error) {
            toast.error("Failed to create ad.", { description: (error as Error).message });
            setIsSubmitting(false);
        }
    };

    if (!currentUser) {
        return <div className="text-center py-16">Loading user data...</div>;
    }
    // TODO: Add check if user is an advertiser

    return (
        <div className="max-w-4xl mx-auto py-8 px-4">
            <Link href="/ads/dashboard" className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-4">
                <ArrowLeft className="h-4 w-4" />
                Back to Ad Dashboard
            </Link>
            
            <h1 className="text-3xl font-bold mb-6">Create New Ad</h1>

            <form onSubmit={handleSubmit} className="space-y-6">
                <SettingsSection title="Ad Content" description="What your ad will look like to users.">
                    <Input label="Title" name="title" value={formData.title} onChange={handleChange} placeholder="Catchy ad title" />
                    <Textarea label="Content" name="content" value={formData.content} onChange={handleChange} placeholder="What do you want to promote?" maxLength={2000} />
                    <Input label="Image URL (optional)" name="imageUrl" value={formData.imageUrl} onChange={handleChange} placeholder="https://example.com/ad-image.jpg" />
                    <Input label="Link URL" name="linkUrl" value={formData.linkUrl} onChange={handleChange} placeholder="https://your-website.com" subtext="Where users will go when they click your ad." />
                </SettingsSection>

                <SettingsSection title="Budget & Scheduling" description="Set your budget and when your ad will run.">
                    <Input label="Budget (per click/impression)" name="budget" type="number" value={formData.budget.toString()} onChange={handleChange} placeholder="100" subtext="Minimum $1." />
                    <Input label="Expires At (optional)" name="expiresAt" type="date" value={formData.expiresAt} onChange={handleChange} subtext="Leave blank for no expiry." />
                </SettingsSection>

                <SettingsSection title="Targeting" description="Who do you want to see your ad?">
                    <Input label="Target University (optional)" name="targetUniversity" value={formData.targetUniversity} onChange={handleChange} placeholder="e.g., Harvard" />
                    <div>
                        <label className="block text-sm font-medium text-foreground">Target Role (optional)</label>
                        <select name="targetRole" value={formData.targetRole} onChange={handleChange} className="w-full mt-1 px-3 py-2 text-sm bg-muted/50 rounded-md focus:outline-none focus:ring-1 focus:ring-primary">
                            <option value="">Any Role</option>
                            <option value="Student">Student</option>
                            <option value="Research Scholar">Research Scholar</option>
                            <option value="Faculty">Faculty</option>
                        </select>
                    </div>
                    <Input label="Target Skills (comma-separated, optional)" name="targetSkills" value={formData.targetSkills.join(', ')} onChange={handleSkillChange} placeholder="e.g., AI, Machine Learning" subtext="Users with these skills will be targeted." />
                </SettingsSection>

                <div className="flex justify-end">
                    <FormButton isSubmitting={isSubmitting} text="Create Ad" />
                </div>
            </form>
        </div>
    );
}
