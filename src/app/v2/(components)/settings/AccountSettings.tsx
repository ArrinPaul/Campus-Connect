'use client';

import { useMutation } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { toast } from 'sonner';
import { useState } from 'react';
import { SettingsSection } from './SettingComponents';
import { Loader2 } from 'lucide-react';

export function AccountSettings() {
    const deleteAccount = useMutation(api.users.deleteAccount);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleDelete = async () => {
        const confirmed = window.confirm("Are you absolutely sure? This action cannot be undone. This will permanently delete your account and remove your data from our servers.");
        if (!confirmed) return;

        setIsSubmitting(true);
        toast.loading("Deleting your account...");
        try {
            await deleteAccount();
            toast.success("Your account deletion has started. You will be logged out shortly.");
        } catch (error) {
            toast.error("Failed to delete account.", { description: (error as Error).message });
            setIsSubmitting(false);
        }
        // No finally block, because on success the user will be logged out.
    };

    return (
        <div>
            <h2 className="text-2xl font-bold mb-6">Account</h2>
            <SettingsSection
                title="Delete Account"
                description="Permanently delete your account and all of your content. This action is not reversible."
            >
                <button 
                    onClick={handleDelete}
                    disabled={isSubmitting}
                    className="h-10 py-2 px-4 btn-press bg-destructive text-destructive-foreground hover:bg-destructive/90 rounded-md flex items-center disabled:opacity-50"
                >
                    {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Delete Account
                </button>
            </SettingsSection>
        </div>
    );
}
