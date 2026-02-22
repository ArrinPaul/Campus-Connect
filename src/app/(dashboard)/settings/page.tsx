'use client';

import { Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { SettingsNav } from '../../(components)/settings/SettingsNav';
import { ProfileSettings } from '../../(components)/settings/ProfileSettings';
import { AccountSettings } from '../../(components)/settings/AccountSettings';
import { PrivacySettings } from '../../(components)/settings/PrivacySettings';
import { NotificationSettings } from '../../(components)/settings/NotificationSettings';
import { BillingSettings } from '../../(components)/settings/BillingSettings';

function SettingsPageContent() {
    const searchParams = useSearchParams();
    const tab = searchParams.get('tab') || 'profile';

    return (
        <div className="flex flex-col md:flex-row gap-8 max-w-5xl mx-auto py-8 px-4">
            <SettingsNav />
            <div className="flex-1">
                {tab === 'profile' && <ProfileSettings />}
                {tab === 'account' && <AccountSettings />}
                {tab === 'privacy' && <PrivacySettings />}
                {tab === 'notifications' && <NotificationSettings />}
                {tab === 'billing' && <BillingSettings />}
            </div>
        </div>
    );
}

export default function SettingsPage() {
    return (
        <Suspense fallback={<div>Loading...</div>}>
            <SettingsPageContent />
        </Suspense>
    );
}
