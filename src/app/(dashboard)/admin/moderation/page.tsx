"use client";

import { useQuery, useAction, api } from"@/lib/api";
import { ShieldAlert, AlertTriangle, Check, Trash2 } from"lucide-react";
import Image from"next/image";
import { formatDistanceToNow } from"date-fns";
import { EmptyState } from"@/components/ui/empty-state";

export default function AdminModerationPage() {
 const currentUser = useQuery(api.users.getCurrentUser);
 const reportedContent = useQuery(api.admin.getReportedContent);
 const moderateContent = useAction(api.admin.moderateContent);

 if (currentUser === undefined || reportedContent === undefined) {
 return <div className="text-center py-16">Loading moderation queue...</div>;
 }

 if (!currentUser || (!currentUser.is_admin && currentUser.role !=="admin")) {
 return (
 <div className="max-w-xl mx-auto py-16 text-center text-muted-foreground">
 <ShieldAlert className="h-16 w-16 mx-auto mb-4 text-critical" />
 <h3 className="text-xl font-semibold">Access Denied</h3>
 <p className="mt-2">You do not have administrative privileges to view this page.</p>
 </div>
 );
 }

 const handleAction = async (report: any, action: string) => {
 if (action ==="delete" && !confirm("Are you sure you want to permanently delete this content?")) {
 return;
 }

 await moderateContent({ targetId: report.target_id, type: report.target_type, action, reportId: report.id });
 // Invalidate cache or reload
 window.location.reload();
 };

 return (
 <div className="max-w-4xl mx-auto py-8 px-4">
 <div className="flex flex-col mb-8 gap-2">
 <h1 className="text-3xl font-bold flex items-center gap-2">
 <AlertTriangle className="text-amber-500" />
 Content Moderation
 </h1>
 <p className="text-muted-foreground">Review reported posts and comments from the community.</p>
 </div>

 <div className="space-y-6">
 {(!reportedContent || reportedContent.length === 0) ? (
 <EmptyState icon={Check} title="The moderation queue is empty" description="Great job!" />
 ) : (
 reportedContent.map((item: any) => (
 <div key={item.id} className="bg-card border border-border rounded-lg overflow-hidden flex flex-col md:flex-row">
 <div className="bg-critical/10 p-4 md:w-48 border-b md:border-b-0 md:border-r border-critical/20 flex flex-col justify-center items-center text-center">
 <span className="text-xs uppercase font-bold tracking-wider text-critical mb-1">
 {item.reason?.replace(/_/g, ' ')}
 </span>
 <span className="text-xs text-critical/70">Reported {item.target_type}</span>
 </div>

 <div className="p-4 flex-1">
 <div className="flex items-center gap-2 mb-3">
 {item.reporter?.profile_picture ? (
 <Image src={item.reporter.profile_picture} alt={item.reporter.name} width={24} height={24} className="rounded-full object-cover" />
 ) : (
 <div className="w-6 h-6 rounded-full bg-canvas flex items-center justify-center text-[10px]">
 {item.reporter?.name?.charAt(0) || '?'}
 </div>
 )}
 <span className="text-sm font-medium">Reported by {item.reporter?.name ||"Unknown"}</span>
 <span className="text-xs text-muted-foreground">
 {item.created_at ? formatDistanceToNow(new Date(item.created_at), { addSuffix: true }) :""}
 </span>
 </div>
 {item.description && <p className="text-sm mb-4 line-clamp-3">{item.description}</p>}

 <div className="flex gap-3 justify-end pt-3 border-t">
 <button
 onClick={() => handleAction(item,"dismiss")}
 className="px-3 py-1.5 text-sm font-medium rounded-md hover:bg-canvas text-muted-foreground transition-colors"
 >
 Dismiss Report
 </button>
 <button
 onClick={() => handleAction(item,"delete")}
 className="px-3 py-1.5 text-sm font-medium rounded-md bg-critical text-white hover:opacity-90 flex items-center gap-2 transition-colors"
 >
 <Trash2 className="w-4 h-4" />
 Delete Content
 </button>
 </div>
 </div>
 </div>
 ))
 )}
 </div>
 </div>
 );
}
