'use client';

import { useQuery, useMutation } from '@/lib/api';
import { api } from '@/lib/api';
import type { Id } from '@/lib/api';
import { useState } from 'react';
import { Mail, Check, X, Loader2, Users } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

export function MyInvitesBanner() {
 const invites = useQuery(api.communities.getMyInvites);
 const acceptInvite = useMutation(api.communities.respondToInvite);
 const declineInvite = useMutation(api.communities.respondToInvite);
 const [processing, setProcessing] = useState<string | null>(null);

 if (!invites || invites.length === 0) return null;

 const handleAccept = async (inviteId: Id<'communityInvites'>) => {
 setProcessing(inviteId);
 try {
 await acceptInvite({ inviteId });
 toast.success('Invite accepted! You are now a member.');
 } catch (err: any) {
 toast.error(err.message || 'Failed to accept invite');
 } finally {
 setProcessing(null);
 }
 };

 const handleDecline = async (inviteId: Id<'communityInvites'>) => {
 setProcessing(inviteId);
 try {
 await declineInvite({ inviteId });
 toast.success('Invite declined.');
 } catch (err: any) {
 toast.error(err.message || 'Failed to decline invite');
 } finally {
 setProcessing(null);
 }
 };

 return (
 <div className="rounded-lg border border-hairline bg-canvas/50 p-lg shadow-sm">
 <div className="flex items-center gap-2 mb-lg">
 <div className="p-2 rounded-full bg-primary/10 text-primary">
 <Mail className="h-4 w-4" />
 </div>
 <h3 className="font-semibold text-ink">
 Community Invites ({invites.length})
 </h3>
 </div>
 <div className="space-y-3">
 {invites.map((invite: any) => (
 <div key={invite._id} className="flex items-center gap-md rounded-md bg-canvas p-md border border-hairline transition-all hover:shadow-product">
 {invite.community?.avatarUrl ? (
 <Image
 src={invite.community.avatarUrl}
 alt={invite.community?.name || 'Community'}
 width={48}
 height={48}
 className="h-12 w-12 rounded-sm object-cover flex-shrink-0"
 />
 ) : (
 <div className="h-12 w-12 rounded-sm bg-canvas text-ink/20 flex items-center justify-center font-bold flex-shrink-0">
 <Users size={20} />
 </div>
 )}
 <div className="flex-1 min-w-0">
 <Link
 href={`/c/${invite.community?.slug || ''}`}
 className="font-semibold hover:text-primary transition-colors"
 >
 {invite.community?.name || 'Unknown Community'}
 </Link>
 <p className="text-caption text-slate">
 Invited by {invite.inviter?.name || 'someone'}
 </p>
 </div>
 <div className="flex items-center gap-2">
 <Button 
 variant="primary" 
 size="sm" 
 className="h-9 px-4"
 onClick={() => handleAccept(invite._id)}
 disabled={processing === invite._id}
 >
 {processing === invite._id ? (
 <Loader2 className="h-3.5 w-3.5 animate-spin" />
 ) : (
 <Check className="h-3.5 w-3.5" />
 )}
 <span className="ml-1.5">Accept</span>
 </Button>
 <Button 
 variant="pearl" 
 size="sm" 
 className="h-9 w-9 p-0"
 onClick={() => handleDecline(invite._id)}
 disabled={processing === invite._id}
 >
 <X className="h-4 w-4" />
 </Button>
 </div>
 </div>
 ))}
 </div>
 </div>
 );
}
