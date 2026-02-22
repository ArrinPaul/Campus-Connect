'use client';

import { useQuery, useMutation } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { toast } from 'sonner';
import { useState, useEffect, type FC } from 'react';
import { SettingsSection, FormButton } from './SettingComponents';

// A temporary, self-contained v2 Switch component.
const TempSwitch: FC<{ checked: boolean; onCheckedChange: (checked: boolean) => void }> = ({ checked, onCheckedChange }) => (
    <button
        type="button"
        role="switch"
        aria-checked={checked}
        onClick={() => onCheckedChange(!checked)}
        className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 ${
            checked ? 'bg-primary' : 'bg-muted'
        }`}
    >
        <span
            aria-hidden="true"
            className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                checked ? 'translate-x-5' : 'translate-x-0'
            }`}
        />
    </button>
);

const SwitchItem: FC<{ title: string; description: string; checked: boolean; onToggle: () => void }> = ({ title, description, checked, onToggle }) => (
    <div className="flex items-center justify-between p-2 rounded-md hover:bg-muted/50">
        <div>
            <label className="font-medium text-sm">{title}</label>
            <p className="text-xs text-muted-foreground">{description}</p>
        </div>
        <TempSwitch checked={checked} onCheckedChange={onToggle} />
    </div>
);

export function NotificationSettings() {
    const currentUser = useQuery(api.users.getCurrentUser);
    const updateNotifs = useMutation(api.users.updateNotificationPreferences);
    
    const [prefs, setPrefs] = useState({
        reactions: true,
        comments: true,
        mentions: true,
        follows: true,
    });
    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        if (currentUser?.notificationPreferences) {
            setPrefs(currentUser.notificationPreferences);
        }
    }, [currentUser]);

    const handleToggle = (key: keyof typeof prefs) => {
        setPrefs(prev => ({ ...prev, [key]: !prev[key] }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);
        try {
            await updateNotifs(prefs);
            toast.success("Notification preferences updated!");
        } catch (error) {
            toast.error("Failed to update preferences.", { description: (error as Error).message });
        } finally {
            setIsSubmitting(false);
        }
    };

    if (!currentUser) return <div>Loading...</div>; // Or a skeleton

    return (
        <form onSubmit={handleSubmit}>
            <h2 className="text-2xl font-bold mb-6">Notifications</h2>
            <SettingsSection
                title="Push Notifications"
                description="Select which activities you want to be notified about."
            >
                <SwitchItem 
                    title="Reactions"
                    description="Notify me when someone reacts to my post or comment."
                    checked={prefs.reactions}
                    onToggle={() => handleToggle('reactions')}
                />
                <SwitchItem 
                    title="Comments & Replies"
                    description="Notify me when someone comments on my post or replies."
                    checked={prefs.comments}
                    onToggle={() => handleToggle('comments')}
                />
                <SwitchItem 
                    title="Mentions"
                    description="Notify me when someone mentions me in a post or comment."
                    checked={prefs.mentions}
                    onToggle={() => handleToggle('mentions')}
                />
                 <SwitchItem 
                    title="New Followers"
                    description="Notify me when someone starts following me."
                    checked={prefs.follows}
                    onToggle={() => handleToggle('follows')}
                />
            </SettingsSection>
             <div className="flex justify-end">
                <FormButton isSubmitting={isSubmitting} />
            </div>
        </form>
    );
}
