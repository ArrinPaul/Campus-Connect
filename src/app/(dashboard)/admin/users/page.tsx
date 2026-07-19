"use client";

import { useQuery, useAction, api } from"@/lib/api";
import { ShieldAlert, MoreVertical, Shield, Ban, CheckCircle, Search } from"lucide-react";
import Image from"next/image";
import { useState } from"react";
import { formatDistanceToNow } from"date-fns";

export default function AdminUsersPage() {
 const currentUser = useQuery(api.users.getCurrentUser);
 const users = useQuery(api.admin.getUsers);
 const manageUser = useAction(api.admin.manageUser);
 const [searchTerm, setSearchTerm] = useState("");

 if (currentUser === undefined || users === undefined) {
 return <div className="text-center py-16">Loading users...</div>;
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

 const filteredUsers = users.filter((u: any) => 
 u.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
 u.username?.toLowerCase().includes(searchTerm.toLowerCase()) ||
 u.university?.toLowerCase().includes(searchTerm.toLowerCase())
 );

 const handleAction = async (userId: string, action: string) => {
 if (confirm(`Are you sure you want to ${action} this user?`)) {
 await manageUser({ targetUserId: userId, action });
 // Invalidate cache or just reload
 window.location.reload();
 }
 };

 return (
 <div className="max-w-6xl mx-auto py-8 px-4">
 <div className="flex flex-col sm:flex-row items-center justify-between mb-8 gap-4">
 <h1 className="text-3xl font-bold">User Management</h1>
 <div className="relative w-full sm:w-64">
 <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate" />
 <input 
 type="text" 
 placeholder="Search users..." 
 className="w-full pl-9 pr-4 py-2 border border-hairline rounded-full bg-canvas"
 value={searchTerm}
 onChange={(e) => setSearchTerm(e.target.value)}
 />
 </div>
 </div>

 <div className="bg-surface-soft border border-hairline rounded-xl overflow-hidden">
 <table className="w-full text-left border-collapse divide-y divide-hairline">
 <thead>
 <tr className="bg-canvas text-xs font-semibold text-slate uppercase tracking-wider">
 <th className="p-4 font-medium">User</th>
 <th className="p-4 font-medium">Role</th>
 <th className="p-4 font-medium">University</th>
 <th className="p-4 font-medium">Joined</th>
 <th className="p-4 font-medium text-right">Actions</th>
 </tr>
 </thead>
 <tbody>
 {filteredUsers.length === 0 ? (
 <tr>
 <td colSpan={5} className="p-8 text-center text-slate">
 No users found.
 </td>
 </tr>
 ) : (
 filteredUsers.map((user: any) => (
 <tr key={user.id} className="hover:bg-canvas/20">
 <td className="p-4">
 <div className="flex items-center gap-3">
 <div className="relative w-10 h-10 rounded-full overflow-hidden bg-canvas">
 {user.profile_picture ? (
 <Image src={user.profile_picture} alt={user.name} fill className="object-cover" />
 ) : (
 <div className="w-full h-full flex items-center justify-center font-bold text-slate">
 {user.name.charAt(0)}
 </div>
 )}
 </div>
 <div>
 <div className="font-medium text-ink-deep">{user.name}</div>
 <div className="text-xs text-slate">@{user.username || user.id.slice(0,8)}</div>
 </div>
 </div>
 </td>
 <td className="p-4">
 <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
 user.role === 'admin' ? 'bg-primary/10 text-primary' : 
 user.role === 'suspended' ? 'bg-critical/20 text-critical' :
 'bg-canvas text-slate'
 }`}>
 {user.role || 'student'}
 </span>
 </td>
 <td className="p-4 text-sm text-slate">{user.university ||"Not specified"}</td>
 <td className="p-4 text-sm text-slate">
 {user.created_at ? formatDistanceToNow(new Date(user.created_at), { addSuffix: true }) :"Unknown"}
 </td>
 <td className="p-4 text-right">
 <div className="flex items-center justify-end gap-2">
 {user.role !== 'admin' && (
 <>
 <button onClick={() => handleAction(user.id,"make_admin")} className="p-2 hover:bg-canvas rounded-full text-primary" title="Make Admin">
 <Shield className="w-4 h-4" />
 </button>
 {user.role === 'suspended' ? (
 <button onClick={() => handleAction(user.id,"restore")} className="p-2 hover:bg-canvas rounded-full text-success" title="Restore User">
 <CheckCircle className="w-4 h-4" />
 </button>
 ) : (
 <button onClick={() => handleAction(user.id,"suspend")} className="p-2 hover:bg-canvas rounded-full text-critical" title="Suspend User">
 <Ban className="w-4 h-4" />
 </button>
 )}
 </>
 )}
 {user.role === 'admin' && user.id !== currentUser._id && (
 <button onClick={() => handleAction(user.id,"restore")} className="p-2 hover:bg-canvas rounded-full text-critical" title="Remove Admin">
 <Ban className="w-4 h-4" />
 </button>
 )}
 </div>
 </td>
 </tr>
 ))
 )}
 </tbody>
 </table>
 </div>
 </div>
 );
}
