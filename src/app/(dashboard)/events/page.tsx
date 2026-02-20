"use client"

import { useState } from "react"
import { useUser } from "@clerk/nextjs"
import { useQuery } from "convex/react"
import { api } from "@/convex/_generated/api"
import { EventCard } from "@/components/events/EventCard"
import { CreateEventModal } from "@/components/events/CreateEventModal"
import { Calendar, Plus } from "lucide-react"

type Tab = "upcoming" | "my-events" | "past"

function EventSkeleton() {
  return (
    <div className="animate-pulse rounded-xl border border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-800 p-4 space-y-3">
      <div className="h-4 w-2/3 rounded bg-gray-200 dark:bg-gray-700" />
      <div className="h-3 w-full rounded bg-gray-200 dark:bg-gray-700" />
      <div className="h-3 w-3/4 rounded bg-gray-200 dark:bg-gray-700" />
      <div className="flex gap-3">
        <div className="h-3 w-1/4 rounded bg-gray-200 dark:bg-gray-700" />
        <div className="h-3 w-1/4 rounded bg-gray-200 dark:bg-gray-700" />
      </div>
    </div>
  )
}

const TABS: { id: Tab; label: string }[] = [
  { id: "upcoming", label: "Upcoming" },
  { id: "my-events", label: "My Events" },
  { id: "past", label: "Past" },
]

export default function EventsPage() {
  const { isLoaded, isSignedIn } = useUser()
  const [activeTab, setActiveTab] = useState<Tab>("upcoming")
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [typeFilter, setTypeFilter] = useState<"in_person" | "virtual" | "hybrid" | undefined>(undefined)

  const upcomingEvents = useQuery(
    api.events.getUpcomingEvents,
    isLoaded && isSignedIn
      ? { limit: 30, eventType: typeFilter }
      : "skip"
  )

  const myEvents = useQuery(
    api.events.getUserEvents,
    isLoaded && isSignedIn && activeTab === "my-events" ? {} : "skip"
  )

  const pastEvents = useQuery(
    api.events.getPastEvents,
    isLoaded && isSignedIn && activeTab === "past" ? { limit: 30 } : "skip"
  )

  const currentEvents =
    activeTab === "upcoming"
      ? upcomingEvents
      : activeTab === "my-events"
        ? myEvents
        : pastEvents

  return (
    <div className="mx-auto max-w-3xl px-4 py-6">
      {/* Page header */}
      <div className="mb-6 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Calendar className="h-6 w-6 text-blue-600 dark:text-blue-400" />
          <h1 className="text-xl font-bold text-gray-900 dark:text-gray-100">Events</h1>
        </div>
        {isSignedIn && (
          <button
            onClick={() => setShowCreateModal(true)}
            className="flex items-center gap-1.5 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
          >
            <Plus className="h-4 w-4" />
            Create Event
          </button>
        )}
      </div>

      {/* Tabs */}
      <div className="mb-4 flex gap-1 border-b border-gray-200 dark:border-gray-700">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`pb-2.5 px-3 text-sm font-medium transition-colors border-b-2 -mb-px ${
              activeTab === tab.id
                ? "text-blue-600 dark:text-blue-400 border-blue-600 dark:border-blue-400"
                : "text-gray-500 dark:text-gray-400 border-transparent hover:text-gray-700 dark:hover:text-gray-200"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Type filter for upcoming */}
      {activeTab === "upcoming" && (
        <div className="mb-4 flex gap-2 flex-wrap">
          {([undefined, "in_person", "virtual", "hybrid"] as const).map((type) => (
            <button
              key={type ?? "all"}
              onClick={() => setTypeFilter(type)}
              className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
                typeFilter === type
                  ? "bg-blue-600 text-white"
                  : "bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600"
              }`}
            >
              {type === undefined ? "All Types" : type === "in_person" ? "In Person" : type === "virtual" ? "Virtual" : "Hybrid"}
            </button>
          ))}
        </div>
      )}

      {/* Events list */}
      {currentEvents === undefined ? (
        <div className="grid gap-3 sm:grid-cols-2">
          {[...Array(4)].map((_, i) => <EventSkeleton key={i} />)}
        </div>
      ) : currentEvents.length === 0 ? (
        <div className="py-16 text-center">
          <Calendar className="mx-auto mb-3 h-10 w-10 text-gray-300 dark:text-gray-600" />
          <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
            {activeTab === "upcoming"
              ? "No upcoming events"
              : activeTab === "my-events"
                ? "You haven't RSVPed to any events yet"
                : "No past events"}
          </p>
          {activeTab === "upcoming" && isSignedIn && (
            <button
              onClick={() => setShowCreateModal(true)}
              className="mt-3 text-sm text-blue-600 dark:text-blue-400 hover:underline"
            >
              Create the first event
            </button>
          )}
        </div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2">
          {currentEvents.map((event: any) => (
            <EventCard key={event._id} event={event} />
          ))}
        </div>
      )}

      {/* Create Event Modal */}
      {showCreateModal && (
        <CreateEventModal onClose={() => setShowCreateModal(false)} />
      )}
    </div>
  )
}
