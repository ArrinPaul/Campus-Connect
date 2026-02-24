'use client';

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import type { Doc } from '@/convex/_generated/dataModel';
import { Calendar, MapPin, Users, Video, Globe, User as UserIcon } from 'lucide-react';
import { format, isToday, isTomorrow } from 'date-fns';

type Event = Doc<'events'> & {
    organizer: {
        name: string | null;
        profilePicture: string | null;
    } | null;
};

type Props = {
    event: Event;
};

export function EventCard({ event }: Props) {
    const startDate = new Date(event.startDate);
    const endDate = new Date(event.endDate);

    const formattedDate = format(startDate, 'MMM d');
    let timeRange = `${format(startDate, 'p')} - ${format(endDate, 'p')}`;

    if (isToday(startDate)) {
        timeRange = `Today, ${timeRange}`;
    } else if (isTomorrow(startDate)) {
        timeRange = `Tomorrow, ${timeRange}`;
    } else {
        timeRange = `${formattedDate}, ${timeRange}`;
    }

    const eventTypeIcon = event.eventType === 'virtual' ? Video : event.eventType === 'in_person' ? MapPin : Globe;

    return (
        <Link href={`/events/${event._id}`} className="block p-4 border rounded-lg bg-card hover:bg-muted/50 transition-colors">
            <h3 className="font-bold text-lg text-primary line-clamp-2">{event.title}</h3>
            <p className="text-sm text-muted-foreground mt-1 line-clamp-2">{event.description}</p>
            
            <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground mt-3">
                <div className="flex items-center gap-1">
                    <Calendar className="h-3.5 w-3.5" /> {timeRange}
                </div>
                <div className="flex items-center gap-1">
                    {React.createElement(eventTypeIcon, { className: 'h-3.5 w-3.5' })}
                    {event.location || (event.eventType === 'virtual' ? 'Virtual' : 'Location TBD')}
                </div>
                {event.attendeeCount > 0 && (
                    <div className="flex items-center gap-1">
                        <Users className="h-3.5 w-3.5" /> {event.attendeeCount} attending
                    </div>
                )}
            </div>

            <div className="flex items-center gap-2 mt-3 text-xs text-muted-foreground border-t pt-3">
                 {event.organizer?.profilePicture ? (
                    <Image src={event.organizer.profilePicture} alt={event.organizer.name || ''} width={20} height={20} className="h-5 w-5 rounded-full object-cover" />
                ) : (
                    <UserIcon className="h-4 w-4" />
                )}
                <p>{event.organizer?.name || 'Anonymous'}</p>
                <span className="mx-1">•</span>
                <p>Organized by</p>
            </div>
        </Link>
    );
}
