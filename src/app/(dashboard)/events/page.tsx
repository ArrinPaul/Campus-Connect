'use client';

import { useQuery } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { EventCard } from '../../(components)/events/EventCard';
import { CreateEventModal } from '@/components/events/CreateEventModal';
import Link from 'next/link';
import { Plus, Filter } from 'lucide-react';
import { useState } from 'react';

const EventCardSkeleton = () => <div className="p-4 border rounded-lg bg-card h-48 animate-pulse" />;

export default function EventsPage() {
    const [eventTypeFilter, setEventTypeFilter] = useState('all'); // 'in_person', 'virtual', 'hybrid'
    const [showCreateModal, setShowCreateModal] = useState(false);

    const events = useQuery(api.events.getUpcomingEvents, { 
        eventType: eventTypeFilter === 'all' ? undefined : (eventTypeFilter as any),
    });

    return (
        <div className="max-w-4xl mx-auto py-8 px-4">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
                <h1 className="text-3xl font-bold">Upcoming Events</h1>
                <div className="flex gap-2">
                    <button
                        onClick={() => setShowCreateModal(true)}
                        className="h-10 py-2 px-4 btn-press bg-primary text-primary-foreground hover:bg-primary/90 rounded-md text-sm font-semibold"
                    >
                        Create Event
                    </button>
                </div>
            </div>

            <div className="flex gap-4 mb-6">
                <select 
                    value={eventTypeFilter} 
                    onChange={(e) => setEventTypeFilter(e.target.value)}
                    className="w-full sm:w-auto px-3 py-2.5 text-base bg-muted/50 rounded-full focus:outline-none focus:ring-1 focus:ring-primary"
                >
                    <option value="all">All Types</option>
                    <option value="in_person">In-Person</option>
                    <option value="virtual">Virtual</option>
                    <option value="hybrid">Hybrid</option>
                </select>
            </div>


            <div className="space-y-4">
                 {events === undefined && (
                    [...Array(5)].map((_, i) => <EventCardSkeleton key={i} />)
                )}
                {events?.map(event => (
                    <EventCard key={event._id} event={event as any} />
                ))}
                {events?.length === 0 && (
                    <div className="text-center py-16">
                        <h3 className="text-lg font-semibold">No upcoming events</h3>
                        <p className="text-muted-foreground mt-2">
                            Check back later or create a new event!
                        </p>
                    </div>
                )}
            </div>

            {showCreateModal && (
                <CreateEventModal onClose={() => setShowCreateModal(false)} />
            )}
        </div>
    );
}
