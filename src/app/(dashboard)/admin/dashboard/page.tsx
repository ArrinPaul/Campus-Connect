'use client';

import { useQuery } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { User, ShieldAlert } from 'lucide-react';

export default function AdminDashboardPage() {
    const currentUser = useQuery(api.users.getCurrentUser);

    if (currentUser === undefined) {
        return <div className="text-center py-16">Loading user data...</div>;
    }

    if (!currentUser || !currentUser.isAdmin) {
        return (
            <div className="max-w-xl mx-auto py-16 text-center text-muted-foreground">
                <ShieldAlert className="h-16 w-16 mx-auto mb-4 text-red-500" />
                <h3 className="text-xl font-semibold">Access Denied</h3>
                <p className="mt-2">You do not have administrative privileges to view this page.</p>
            </div>
        );
    }

    return (
        <div className="max-w-6xl mx-auto py-8 px-4">
            <h1 className="text-3xl font-bold mb-6">Admin Dashboard</h1>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <div className="bg-card border rounded-lg p-6">
                    <h2 className="text-xl font-bold mb-4">Users Overview</h2>
                    <p className="text-muted-foreground">Total users: { /* TODO: Fetch total users */ }</p>
                    <p className="text-muted-foreground">New users this week: { /* TODO: Fetch new users */ }</p>
                    {/* TODO: Add a link to user management page */}
                </div>
                <div className="bg-card border rounded-lg p-6">
                    <h2 className="text-xl font-bold mb-4">Content Moderation</h2>
                    <p className="text-muted-foreground">Reported posts: { /* TODO: Fetch reported posts */ }</p>
                    <p className="text-muted-foreground">Reported comments: { /* TODO: Fetch reported comments */ }</p>
                    {/* TODO: Add a link to moderation tools */}
                </div>
                <div className="bg-card border rounded-lg p-6">
                    <h2 className="text-xl font-bold mb-4">System Health</h2>
                    <p className="text-muted-foreground">API usage: { /* TODO: Fetch API usage stats */ }</p>
                    <p className="text-muted-foreground">Database size: { /* TODO: Fetch DB size */ }</p>
                    {/* TODO: Add a link to system logs */}
                </div>
            </div>
        </div>
    );
}
