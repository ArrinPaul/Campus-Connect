"use client";

import { useQuery, useAction, api } from "@/lib/api";
import { ShieldAlert, AlertTriangle, Check, Trash2 } from "lucide-react";
import Image from "next/image";
import { formatDistanceToNow } from "date-fns";

export default function AdminModerationPage() {
  const currentUser = useQuery(api.users.getCurrentUser);
  const reportedContent = useQuery(api.admin.getReportedContent);
  const moderateContent = useAction(api.admin.moderateContent);

  if (currentUser === undefined || reportedContent === undefined) {
    return <div className="text-center py-16">Loading moderation queue...</div>;
  }

  if (!currentUser || (!currentUser.is_admin && currentUser.role !== "admin")) {
    return (
      <div className="max-w-xl mx-auto py-16 text-center text-muted-foreground">
        <ShieldAlert className="h-16 w-16 mx-auto mb-4 text-red-500" />
        <h3 className="text-xl font-semibold">Access Denied</h3>
        <p className="mt-2">You do not have administrative privileges to view this page.</p>
      </div>
    );
  }

  const handleAction = async (targetId: string, type: string, action: string) => {
    if (action === "delete" && !confirm("Are you sure you want to permanently delete this content?")) {
        return;
    }
    
    await moderateContent({ targetId, type, action });
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
            <div className="text-center py-12 bg-card border rounded-lg text-muted-foreground">
                <Check className="w-12 h-12 mx-auto text-green-500 mb-4 opacity-50" />
                <p>The moderation queue is empty. Great job!</p>
            </div>
        ) : (
            reportedContent.map((item: any) => (
                <div key={item.id} className="bg-card border rounded-lg overflow-hidden flex flex-col md:flex-row">
                    <div className="bg-red-500/10 p-4 md:w-48 border-b md:border-b-0 md:border-r border-red-500/20 flex flex-col justify-center items-center text-center">
                        <span className="text-xs uppercase font-bold tracking-wider text-red-600 dark:text-red-400 mb-1">
                            {item.reportReason}
                        </span>
                        <span className="text-2xl font-bold text-red-600 dark:text-red-400">
                            {item.reportCount}
                        </span>
                        <span className="text-xs text-red-600/70 dark:text-red-400/70">Reports</span>
                    </div>
                    
                    <div className="p-4 flex-1">
                        <div className="flex items-center gap-2 mb-3">
                            {item.author?.profile_picture ? (
                                <Image src={item.author.profile_picture} alt={item.author.name} width={24} height={24} className="rounded-full object-cover" />
                            ) : (
                                <div className="w-6 h-6 rounded-full bg-muted flex items-center justify-center text-[10px]">
                                    {item.author?.name?.charAt(0) || '?'}
                                </div>
                            )}
                            <span className="text-sm font-medium">{item.author?.name || "Unknown"}</span>
                            <span className="text-xs text-muted-foreground">
                                {item.created_at ? formatDistanceToNow(new Date(item.created_at), { addSuffix: true }) : ""}
                            </span>
                        </div>
                        <p className="text-sm mb-4 line-clamp-3">{item.content}</p>
                        
                        <div className="flex gap-3 justify-end pt-3 border-t">
                            <button 
                                onClick={() => handleAction(item.id, item.type, "ignore")}
                                className="px-3 py-1.5 text-sm font-medium rounded-md hover:bg-muted text-muted-foreground transition-colors"
                            >
                                Dismiss Reports
                            </button>
                            <button 
                                onClick={() => handleAction(item.id, item.type, "delete")}
                                className="px-3 py-1.5 text-sm font-medium rounded-md bg-red-500 text-white hover:bg-red-600 flex items-center gap-2 transition-colors"
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
