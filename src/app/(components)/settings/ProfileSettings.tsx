'use client';

import { useQuery, useMutation } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { toast } from 'sonner';
import { useState, useEffect } from 'react';
import { Loader2 } from 'lucide-react';
import { SettingsSection, Input, Textarea, FormButton } from './SettingComponents';

export function ProfileSettings() {
    const currentUser = useQuery(api.users.getCurrentUser);
    const updateProfile = useMutation(api.users.updateProfile);
    
    const [formData, setFormData] = useState({
        bio: '',
        university: '',
    });
    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        if (currentUser) {
            setFormData({
                bio: currentUser.bio || '',
                university: currentUser.university || '',
            });
        }
    }, [currentUser]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);
        try {
            await updateProfile(formData);
            toast.success("Profile updated successfully!");
        } catch (error) {
            toast.error("Failed to update profile.", { description: (error as Error).message });
        } finally {
            setIsSubmitting(false);
        }
    };

    if (!currentUser) {
        return (
            <div>
                 <h2 className="text-2xl font-bold mb-6">Public Profile</h2>
                 <div className="h-24 w-full bg-muted/50 animate-pulse rounded-md" />
            </div>
        );
    }

    return (
        <form onSubmit={handleSubmit}>
            <h2 className="text-2xl font-bold mb-6">Public Profile</h2>
            <SettingsSection
                title="Profile Details"
                description="This information will be displayed publicly on your profile."
            >
                <Textarea label="Bio" name="bio" value={formData.bio} onChange={handleChange} maxLength={200} />
                <Input label="University" name="university" value={formData.university} onChange={handleChange} />
            </SettingsSection>

            <div className="flex justify-end">
                <FormButton isSubmitting={isSubmitting} />
            </div>
        </form>
    );
}
