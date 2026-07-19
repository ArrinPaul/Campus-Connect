'use client';

import { useQuery } from '@/lib/api';
import { api } from '@/lib/api';
import { User, ShieldAlert } from 'lucide-react';

export default function AdminDashboardPage() {
 const currentUser = useQuery(api.users.getCurrentUser);

 const stats = useQuery(api.admin.getDashboardStats);

 if (currentUser === undefined || stats === undefined) {
 return <div className="text-center py-16">Loading admin data...</div>;
 }

 if (!currentUser || (!currentUser.is_admin && currentUser.role !=="admin")) {
 return (
 <div className="max-w-xl mx-auto py-16 text-center text-slate">
 <ShieldAlert className="h-16 w-16 mx-auto mb-4 text-critical" />
 <h3 className="text-xl font-semibold">Access Denied</h3>
 <p className="mt-2">You do not have administrative privileges to view this page.</p>
 </div>
 );
 }

 return (
 <div className="max-w-6xl mx-auto py-8 px-4">
 <h1 className="text-3xl font-bold mb-6">Admin Dashboard</h1>

 <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
 <div className="bg-surface-soft border border-hairline rounded-xl p-6">
 <h2 className="text-xl font-bold mb-4">Users Overview</h2>
 <p className="text-slate mb-1">Total users: <span className="text-ink-deep font-medium">{stats.totalUsers || 0}</span></p>
 <p className="text-slate mb-4">New users this week: <span className="text-ink-deep font-medium">{stats.newUsersThisWeek || 0}</span></p>
 <a href="/admin/users" className="text-primary hover:underline font-medium text-sm">Manage Users &rarr;</a>
 </div>
 <div className="bg-surface-soft border border-hairline rounded-xl p-6">
 <h2 className="text-xl font-bold mb-4">Content Moderation</h2>
 <p className="text-slate mb-1">Reported posts: <span className="text-ink-deep font-medium">{stats.reportedPosts || 0}</span></p>
 <p className="text-slate mb-4">Reported comments: <span className="text-ink-deep font-medium">{stats.reportedComments || 0}</span></p>
 <a href="/admin/moderation" className="text-primary hover:underline font-medium text-sm">Review Content &rarr;</a>
 </div>
 <div className="bg-surface-soft border border-hairline rounded-xl p-6">
 <h2 className="text-xl font-bold mb-4">System Health</h2>
 <p className="text-slate mb-1">API usage: <span className="text-ink-deep font-medium">{stats.apiUsage ||"N/A"}</span></p>
 <p className="text-slate mb-4">Database size: <span className="text-ink-deep font-medium">{stats.dbSize ||"N/A"}</span></p>
 <a href="#" className="text-primary hover:underline font-medium text-sm">View Logs &rarr;</a>
 </div>
 </div>
 </div>
 );
}
