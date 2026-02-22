'use client';

import { useQuery, useMutation } from 'convex/react';
import { api } from '@/convex/_generated/api';
import type { Id } from '@/convex/_generated/dataModel';
import { notFound } from 'next/navigation';
import { ArrowLeft, Calendar, MapPin, Users, Video, Globe, User as UserIcon, CheckCircle, Clock, XCircle, Loader2 } from 'lucide-react';
import Link from 'next/link';
import { format, formatDistanceToNow, isPast } from 'date-fns';
import { toast } from 'sonner';
import { useState } from 'react';
import { cn } from '@/lib/utils';

type PageProps = {
    params: {
        id: Id<'events'>;
    };
};

export default function EventDetailPage({ params }: PageProps) {
    const event = useQuery(api.events.getEvent, { eventId: params.id });
    const rsvpEvent = useMutation(api.events.rsvpEvent);
    const [isRsvping, setIsRsvping] = useState(false);

    const handleRsvp = async (status: 'going' | 'maybe' | 'not_going') => {
        setIsRsvping(true);
        try {
            await rsvpEvent({ eventId: params.id, status });
            toast.success("RSVP updated!");
        } catch (error) {
            toast.error("Failed to update RSVP.", { description: (error as Error).message });
        } finally {
            setIsRsvping(false);
        }
    };

    if (event === undefined) {
        return <div className="text-center py-16">Loading...</div>;
    }

    if (event === null) {
        notFound();
    }

    const startDate = new Date(event.startDate);
    const endDate = new Date(event.endDate);
    const isEventPast = isPast(endDate);

    const eventTypeIcon = event.eventType === 'virtual' ? Video : event.eventType === 'in_person' ? MapPin : Globe;

    const rsvpStatus = event.viewerRsvp; // 'going' | 'maybe' | 'not_going' | null

    return (
        <div className="max-w-4xl mx-auto py-8 px-4">
             <Link href="/events" className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-4">
                <ArrowLeft className="h-4 w-4" />
                Back to all events
            </Link>

            <div className="bg-card border rounded-lg p-6">
                <h1 className="text-3xl font-bold text-primary mb-2">{event.title}</h1>
                
                <div className="flex flex-wrap gap-x-6 gap-y-2 text-sm text-muted-foreground my-4 border-y py-4">
                    <div className="flex items-center gap-1.5"><Calendar className="h-4 w-4" /> {format(startDate, 'MMM d, yyyy p')} - {format(endDate, 'p')}</div>
                    <div className="flex items-center gap-1.5">
                        {React.createElement(eventTypeIcon, { className: 'h-4 w-4' })}
                        {event.location || (event.eventType === 'virtual' ? 'Virtual' : 'Location TBD')}
                    </div>
                    {event.attendeeCount > 0 && (
                        <div className="flex items-center gap-1.5">
                            <Users className="h-4 w-4" /> {event.attendeeCount} attending
                        </div>
                    )}
                </div>

                <div>
                    <h3 className="font-bold text-lg mb-2">Description</h3>
                    <p className="whitespace-pre-wrap">{event.description}</p>
                </div>

                {event.organizer && (
                    <div className="mt-6 border-t pt-6 flex items-center gap-3">
                        <div className="h-10 w-10 rounded-full bg-muted">
                            {event.organizer.profilePicture && (
                                <img src={event.organizer.profilePicture} alt={event.organizer.name || ''} className="h-full w-full rounded-full object-cover" />
                            )}
                        </div>
                        <div>
                            <p className="text-sm text-muted-foreground">Organized by</p>
                            <Link href={`/profile/${event.organizer._id}`} className="font-bold hover:underline">{event.organizer.name}</Link>
                        </div>
                    </div>
                )}
            </div>

            {!isEventPast && (
                <div className="bg-card border rounded-lg p-6 mt-6">
                    <h3 className="text-xl font-bold mb-4">Your RSVP</h3>
                    <div className="flex flex-wrap gap-3">
                        <button 
                            onClick={() => handleRsvp('going')} 
                            disabled={isRsvping}
                            className={cn("px-4 py-2 rounded-md text-sm font-semibold flex items-center gap-2",
                                rsvpStatus === 'going' ? 'bg-green-500 text-white' : 'bg-muted/50 hover:bg-muted/80'
                            )}
                        >
                            {isRsvping && <Loader2 className="h-4 w-4 animate-spin" />}
                            <CheckCircle className="h-4 w-4" /> Going
                        </button>
                        <button 
                            onClick={() => handleRsvp('maybe')} 
                            disabled={isRsvping}
                            className={cn("px-4 py-2 rounded-md text-sm font-semibold flex items-center gap-2",
                                rsvpStatus === 'maybe' ? 'bg-blue-500 text-white' : 'bg-muted/50 hover:bg-muted/80'
                            )}
                        >
                            {isRsvping && <Loader2 className="h-4 w-4 animate-spin" />}
                            <Clock className="h-4 w-4" /> Maybe
                        </button>
                        <button 
                            onClick={() => handleRsvp('not_going')} 
                            disabled={isRsvping}
                            className={cn("px-4 py-2 rounded-md text-sm font-semibold flex items-center gap-2",
                                rsvpStatus === 'not_going' ? 'bg-red-500 text-white' : 'bg-muted/50 hover:bg-muted/80'
                            )}
                        >
                            {isRsvping && <Loader2 className="h-4 w-4 animate-spin" />}
                            <XCircle className="h-4 w-4" /> Not Going
                        </button>
                    </div>
                </div>
            )}
            
            {isEventPast && (
                <div className="bg-card border rounded-lg p-6 mt-6 text-center text-muted-foreground">
                    <p className="text-lg font-semibold">This event has concluded.</p>
                </div>
            )}
        </div>
    );
}
