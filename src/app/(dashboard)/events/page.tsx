'use client';

import { useQuery } from '@/lib/api';
import { api } from '@/lib/api';
import { EventCard } from '../../(components)/events/EventCard';
import { CreateEventModal } from '@/components/events/CreateEventModal';
import Link from 'next/link';
import { Plus, Filter, Calendar } from 'lucide-react';
import { useState } from 'react';

const EventCardSkeleton = () => <div className="p-4 border border-hairline-soft rounded-xl bg-surface-soft h-[192px] animate-pulse" />;

export default function EventsPage() {
 const [eventTypeFilter, setEventTypeFilter] = useState('all'); // 'in_person', 'virtual', 'hybrid'
 const [showCreateModal, setShowCreateModal] = useState(false);

 const events = useQuery(api.events.getUpcomingEvents, { 
 eventType: eventTypeFilter === 'all' ? undefined : (eventTypeFilter as any),
 });

 return (
 <div className="w-full bg-canvas min-h-screen">
 {/* Header Section */}
 <section className="bg-canvas py-section-sm px-base md:px-xl border-b border-hairline-soft">
 <div className="max-w-6xl mx-auto flex flex-col md:flex-row md:items-end justify-between gap-xl">
 <div className="max-w-2xl flex items-center gap-md">
 <div className="w-14 h-14 bg-surface-soft rounded-circle flex items-center justify-center shrink-0 border border-hairline">
 <Calendar className="w-7 h-7 text-ink-deep" />
 </div>
 <div>
 <h1 className="text-display-lg text-ink-deep mb-xs">Events.</h1>
 <p className="text-subtitle-md text-ink">Discover upcoming campus events and activities</p>
 </div>
 </div>
 <div className="flex gap-sm w-full md:w-auto">
 <button
 onClick={() => setShowCreateModal(true)}
 className="button-buy-cta flex-1 md:flex-none"
 >
 Create Event
 </button>
 </div>
 </div>
 </section>

 {/* Content Section */}
 <section className="py-section-sm px-base md:px-xl">
 <div className="w-full max-w-6xl mx-auto space-y-xl">
 {/* Filter Controls */}
 <div className="flex items-center justify-between pb-md border-b border-hairline">
 <div className="flex items-center gap-2 w-full md:w-auto bg-surface-soft rounded-lg p-xs border border-hairline shrink-0">
 <Filter className="w-4 h-4 text-steel ml-2" />
 <select 
 value={eventTypeFilter} 
 onChange={(e) => setEventTypeFilter(e.target.value)}
 className="text-body-sm-bold text-ink bg-transparent px-3 py-1.5 focus:outline-none appearance-none cursor-pointer"
 >
 <option value="all">All Event Types</option>
 <option value="in_person">In-Person</option>
 <option value="virtual">Virtual</option>
 <option value="hybrid">Hybrid</option>
 </select>
 </div>
 </div>

 <div className="space-y-md">
 {events === undefined && (
 <div className="grid grid-cols-1 lg:grid-cols-2 gap-lg">
 {[...Array(6)].map((_, i) => <EventCardSkeleton key={i} />)}
 </div>
 )}
 
 {events && events.length > 0 && (
 <div className="text-caption-bold text-steel uppercase tracking-wide">
 {events.length} {events.length === 1 ? 'Upcoming Event' : 'Upcoming Events'}
 </div>
 )}
 
 <div className="grid grid-cols-1 lg:grid-cols-2 gap-lg">
 {events?.map((event: any) => (
 <EventCard key={event._id} event={event as any} />
 ))}
 </div>
 
 {events?.length === 0 && (
 <div className="text-center py-section bg-surface-soft rounded-xxxl border border-hairline-soft">
 <Calendar className="w-16 h-16 text-steel/50 mx-auto mb-md" />
 <h3 className="text-heading-lg text-ink-deep mb-sm">No upcoming events</h3>
 <p className="text-body-md text-steel max-w-sm mx-auto mb-xl">
 Check back later or be the first to create a new event!
 </p>
 </div>
 )}
 </div>
 </div>
 </section>

 {showCreateModal && (
 <CreateEventModal onClose={() => setShowCreateModal(false)} />
 )}
 </div>
 );
}
