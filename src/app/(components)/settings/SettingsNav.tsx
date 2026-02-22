'use client';

import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { User, Shield, Bell, CreditCard, Lock } from 'lucide-react';
import { cn } from '@/lib/utils';

const navItems = [
    { href: 'profile', label: 'Public Profile', icon: User },
    { href: 'account', label: 'Account', icon: Lock },
    { href: 'privacy', label: 'Privacy & Safety', icon: Shield },
    { href: 'notifications', label: 'Notifications', icon: Bell },
    { href: 'billing', label: 'Billing', icon: CreditCard },
];

export function SettingsNav() {
    const searchParams = useSearchParams();
    const currentTab = searchParams.get('tab') || 'profile';

    return (
        <nav className="flex flex-row md:flex-col gap-1 md:w-48 flex-shrink-0">
            {navItems.map(item => (
                <Link 
                    key={item.href}
                    href={`/settings?tab=${item.href}`}
                    scroll={false}
                    className={cn(
                        "flex items-center gap-3 p-2 rounded-md transition-colors text-sm",
                        currentTab === item.href 
                            ? 'bg-muted font-semibold text-foreground' 
                            : 'hover:bg-muted/50 text-muted-foreground'
                    )}
                >
                    <item.icon className="h-4 w-4" />
                    <span className="hidden md:inline">{item.label}</span>
                </Link>
            ))}
        </nav>
    );
}
